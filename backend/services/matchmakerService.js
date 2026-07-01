import { getDb } from './db.js';

const IDUBBU_RATE = 1000; // 1 USDT = 1000 Idubbu — keep in sync with wallet.js

function normalizeKey(key) {
  if (typeof key !== 'string') return '';
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function deductWallet(db, walletsCollection, transactionsCollection, uId, entryFee, tierName, matchId) {
  const uWallet = await db.collection(walletsCollection).findOne({ userId: uId });
  const fromDep = Math.min(uWallet?.depositBalance || 0, entryFee);
  const fromWin = entryFee - fromDep;

  await db.collection(walletsCollection).updateOne(
    { userId: uId },
    {
      $inc: {
        depositBalance: -fromDep,
        winningsBalance: -fromWin,
        lockedBalance: entryFee,
        idubbuBalance: -entryFee * IDUBBU_RATE
      }
    }
  );

  return db.collection(transactionsCollection).insertOne({
    userId: uId,
    amount: entryFee,
    type: 'match_entry',
    status: 'locked',
    tier: tierName,
    matchId,
    createdAt: new Date()
  });
}

class MatchmakerService {
  constructor() {
    this.queueCollection = 'matchmaking_queue';
    this.matchesCollection = 'matches';
    this.walletsCollection = 'wallets';
    this.transactionsCollection = 'transactions';
    this.usersCollection = 'user';
  }

  async findMatch(userId, tierName, socketId = null, playerName = null, gameType = 'word_duel') {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Valid userId is required.');
    }
    if (!tierName || typeof tierName !== 'string' || !tierName.trim()) {
      throw new Error('Valid tierName is required.');
    }

    const normUserId = normalizeKey(userId);
    const normTierName = normalizeKey(tierName);
    const normGameType = normalizeKey(gameType || 'word_duel');

    const db = await getDb();

    // Check if player is already in queue
    const existingInQueue = await db.collection(this.queueCollection).findOne({ userId: normUserId });
    if (existingInQueue) {
      // Always sync socketId and name so match notification reaches their current connection
      const updates = {
        ...(socketId && existingInQueue.socketId !== socketId ? { socketId } : {}),
        ...(playerName && existingInQueue.name !== playerName ? { name: playerName } : {}),
      };
      if (Object.keys(updates).length > 0) {
        await db.collection(this.queueCollection).updateOne({ userId: normUserId }, { $set: updates });
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

    const queueEntry = {
      userId: normUserId,
      name: playerName || normUserId,
      tier: normTierName,
      gameType: normGameType,
      socketId,
      joinedAt: new Date()
    };

    // atomic check-and-match — exclude self to prevent self-matching in edge cases, match same tier and game type
    const opponent = await db.collection(this.queueCollection).findOneAndDelete({ 
      tier: normTierName, 
      gameType: normGameType, 
      userId: { $ne: normUserId } 
    });

    if (!opponent) {
      await db.collection(this.queueCollection).insertOne(queueEntry);
      return { status: 'queued', queue: queueEntry };
    }

    // Opponent found — deduct both players in parallel, then create match
    const matchId = 'm_' + Math.random().toString(36).substring(2, 15);
    
    let questions = [];
    try {
      const { quizService } = await import('./quizService.js');
      questions = await quizService.fetchQuestions(5, normGameType);
    } catch (e) {
      console.error("Error fetching quiz questions:", e);
    }

    const matchInfo = {
      matchId,
      tier: normTierName,
      gameType: normGameType,
      players: [opponent.userId, normUserId],
      playerNames: {
        [opponent.userId]: opponent.name || opponent.userId,
        [normUserId]: playerName || normUserId,
      },
      status: 'in_progress',
      startedAt: new Date(),
      rounds: [],
      rake: entryFee * 2 * 0.20,
      questions
    };

    await Promise.all(
      [opponent.userId, normUserId].map(uId =>
        deductWallet(db, this.walletsCollection, this.transactionsCollection, uId, entryFee, tierName, matchId)
      )
    );

    await db.collection(this.matchesCollection).insertOne(matchInfo);

    return {
      status: 'matched',
      match: matchInfo,
      opponent: { userId: opponent.userId, socketId: opponent.socketId }
    };
  }

  async cancelMatchmaking(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Valid userId is required.');
    }
    const normUserId = normalizeKey(userId);
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

    const queuedUser = await db.collection(this.queueCollection).findOne({ socketId });
    if (queuedUser) {
      await this.cancelMatchmaking(queuedUser.userId);
    }
  }

  async endMatch(matchId, winnerId, prize) {
    if (!matchId || typeof matchId !== 'string') throw new Error('Valid matchId is required.');
    if (!winnerId || typeof winnerId !== 'string') throw new Error('Valid winnerId is required.');

    const normMatchId = normalizeKey(matchId);
    const normWinnerId = normalizeKey(winnerId);

    const db = await getDb();
    const match = await db.collection(this.matchesCollection).findOne({ matchId: normMatchId, status: 'in_progress' });
    if (!match) {
      throw new Error('Match not found or already settled.');
    }

    await db.collection(this.matchesCollection).updateOne(
      { matchId: normMatchId },
      { $set: { status: 'completed', winner: normWinnerId, settledAt: new Date() } }
    );

    const tierFees = { rookie: 5, pro: 20, elite: 50 };
    const entryFee = tierFees[normalizeKey(match.tier)] || 5;

    if (normWinnerId === 'tie' || normWinnerId === 'draw') {
      for (const pId of match.players) {
        await db.collection(this.walletsCollection).updateOne(
          { userId: pId },
          {
            $inc: {
              depositBalance: Number(entryFee),
              lockedBalance: -Number(entryFee),
              idubbuBalance: Number(entryFee) * IDUBBU_RATE
            }
          }
        );

        await db.collection(this.transactionsCollection).insertOne({
          userId: pId,
          type: 'refund',
          amount: Number(entryFee),
          matchId: normMatchId,
          tier: match.tier,
          status: 'approved',
          createdAt: new Date()
        });
      }
      return { success: true };
    }

    const loserId = match.players.find(p => p !== normWinnerId);

    // Settle winner: deduct locked, add win balance
    await db.collection(this.walletsCollection).updateOne(
      { userId: normWinnerId },
      {
        $inc: {
          winningsBalance: Number(prize),
          lockedBalance: -Number(entryFee),
          idubbuBalance: Number(prize) * IDUBBU_RATE
        }
      }
    );

    await db.collection(this.transactionsCollection).insertOne({
      userId: normWinnerId,
      type: 'win',
      amount: Number(prize),
      matchId: normMatchId,
      tier: match.tier,
      status: 'approved',
      createdAt: new Date()
    });

    // Settle loser: deduct locked balance
    if (loserId) {
      await db.collection(this.walletsCollection).updateOne(
        { userId: loserId },
        { $inc: { lockedBalance: -Number(entryFee) } }
      );

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
