import { getDb } from './db.js';

class MatchmakerService {
  constructor() {
    this.queueCollection = 'matchmaking_queue';
    this.matchesCollection = 'matches';
    this.walletsCollection = 'wallets';
    this.transactionsCollection = 'transactions';
    this.usersCollection = 'user';
  }

  normalizeKey(key) {
    if (typeof key !== 'string') return '';
    return key.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  async findMatch(userId, tierName, socketId = null) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Valid userId is required.');
    }
    if (!tierName || typeof tierName !== 'string' || !tierName.trim()) {
      throw new Error('Valid tierName is required.');
    }

    const normUserId = this.normalizeKey(userId);
    const normTierName = this.normalizeKey(tierName);

    const db = await getDb();

    // Check if player is already in queue
    const existingInQueue = await db.collection(this.queueCollection).findOne({ userId: normUserId });
    if (existingInQueue) {
      // Always update socketId so match notification reaches their current connection
      if (socketId && existingInQueue.socketId !== socketId) {
        await db.collection(this.queueCollection).updateOne(
          { userId: normUserId },
          { $set: { socketId } }
        );
      }
      return { status: 'already_queued', queue: existingInQueue };
    }

    // Verify wallet exists and has sufficient balance BEFORE entering queue
    const tierFees = { rookie: 5, pro: 20, elite: 50 };
    const entryFee = tierFees[normTierName] || 5;

    const wallet = await db.collection(this.walletsCollection).findOne({ userId: normUserId });
    if (!wallet) {
      throw new Error('Wallet not found for user.');
    }

    const availableBalance = (wallet.depositBalance || 0) + (wallet.winningsBalance || 0);
    if (availableBalance < entryFee) {
      throw new Error('Insufficient balance to join matchmaking.');
    }

    // Put player into queue without locking funds yet
    const queueEntry = {
      userId: normUserId,
      tier: normTierName,
      socketId,
      joinedAt: new Date()
    };

    // atomic check-and-match — exclude self to prevent self-matching in edge cases
    const opponent = await db.collection(this.queueCollection).findOneAndDelete({ tier: normTierName, userId: { $ne: normUserId } });
    if (opponent) {
      // Opponent found! Both users are deducted here at match creation time to prevent front-run or lock issues
      const matchId = 'm_' + Math.random().toString(36).substring(2, 15);
      const matchInfo = {
        matchId,
        tier: tierName,
        players: [opponent.userId, normUserId],
        status: 'in_progress',
        startedAt: new Date(),
        rounds: [],
        rake: entryFee * 2 * 0.10 // 10% rake placeholder
      };

      // Perform atomic balance deduction and lockedBalance additions for BOTH players
      const usersToDeduct = [opponent.userId, normUserId];
      for (const uId of usersToDeduct) {
        const uWallet = await db.collection(this.walletsCollection).findOne({ userId: uId });
        const fromDep = Math.min(uWallet.depositBalance || 0, entryFee);
        const fromWin = entryFee - fromDep;

        await db.collection(this.walletsCollection).updateOne(
          { userId: uId },
          {
            $inc: {
              depositBalance: -fromDep,
              winningsBalance: -fromWin,
              lockedBalance: entryFee,
              idubbuBalance: -entryFee * 1000
            }
          }
        );

        // Record the locked entry transaction
        await db.collection(this.transactionsCollection).insertOne({
          userId: uId,
          amount: entryFee,
          type: 'match_entry',
          status: 'locked',
          tier: tierName,
          matchId,
          createdAt: new Date()
        });
      }

      await db.collection(this.matchesCollection).insertOne(matchInfo);

      return {
        status: 'matched',
        match: matchInfo,
        opponent: { userId: opponent.userId, socketId: opponent.socketId }
      };
    } else {
      // Put player into queue
      await db.collection(this.queueCollection).insertOne(queueEntry);
      return { status: 'queued', queue: queueEntry };
    }
  }

  async cancelMatchmaking(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Valid userId is required.');
    }
    const normUserId = this.normalizeKey(userId);
    const db = await getDb();

    // Atomic pop from queue. No refund needed since funds are not locked until match creation
    const queuedUser = await db.collection(this.queueCollection).findOneAndDelete({ userId: normUserId });
    if (!queuedUser) {
      return { success: false, reason: 'Player not found in queue.' };
    }

    return { success: true };
  }

  async handleDisconnect(socketId) {
    if (!socketId || typeof socketId !== 'string') return;
    const db = await getDb();
    
    // Check if user is in queue
    const queuedUser = await db.collection(this.queueCollection).findOne({ socketId });
    if (queuedUser) {
      await this.cancelMatchmaking(queuedUser.userId);
    }
  }

  async endMatch(matchId, winnerId, prize) {
    if (!matchId || typeof matchId !== 'string') throw new Error('Valid matchId is required.');
    if (!winnerId || typeof winnerId !== 'string') throw new Error('Valid winnerId is required.');

    const normMatchId = this.normalizeKey(matchId);
    const normWinnerId = this.normalizeKey(winnerId);

    const db = await getDb();
    const match = await db.collection(this.matchesCollection).findOne({ matchId: normMatchId, status: 'in_progress' });
    if (!match) {
      throw new Error('Match not found or already settled.');
    }

    const players = match.players;
    const loserId = players.find(p => p !== normWinnerId);

    // Update match state
    await db.collection(this.matchesCollection).updateOne(
      { matchId: normMatchId },
      { $set: { status: 'completed', winner: normWinnerId, settledAt: new Date() } }
    );

    const tierFees = { rookie: 5, pro: 20, elite: 50 };
    const normTierName = this.normalizeKey(match.tier);
    const entryFee = tierFees[normTierName] || 5;

    // Settle winner: deduct locked, add win balance (prize money goes to winning player)
    await db.collection(this.walletsCollection).updateOne(
      { userId: normWinnerId },
      {
        $inc: {
          winningsBalance: Number(prize),
          lockedBalance: -Number(entryFee),
          idubbuBalance: Number(prize) * 1000
        }
      }
    );

    // Record win transaction
    await db.collection(this.transactionsCollection).insertOne({
      userId: normWinnerId,
      type: 'win',
      amount: Number(prize),
      matchId: normMatchId,
      tier: match.tier,
      status: 'approved',
      createdAt: new Date()
    });

    // Settle loser: deduct locked balance (entry fee is gone)
    if (loserId) {
      await db.collection(this.walletsCollection).updateOne(
        { userId: loserId },
        { $inc: { lockedBalance: -Number(entryFee) } }
      );

      // Record loss transaction
      await db.collection(this.transactionsCollection).insertOne({
        userId: loserId,
        type: 'loss',
        amount: Number(entryFee),
        matchId: normMatchId,
        tier: match.tier,
        status: 'approved',
        createdAt: new Date()
      });
    }

    return { success: true };
  }
}

export const matchmakerService = new MatchmakerService();
