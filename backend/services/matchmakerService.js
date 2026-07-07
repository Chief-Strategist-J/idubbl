import { getDb } from './db.js';

const IDUBBU_RATE = 1; // 1 USDT = 1 Idubbu — keep in sync with wallet.js

function normalizeKey(key) {
  if (typeof key !== 'string') return '';
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function deductWallet(db, walletsCollection, transactionsCollection, uId, entryFee, tierName, matchId) {
  // Case-insensitive lookup: wallets may be stored with different case than the normalized queue userId
  const uWallet = await db.collection(walletsCollection).findOne({
    userId: { $regex: new RegExp(`^${uId}$`, 'i') }
  });
  const fromDep = Math.min(uWallet?.depositBalance || 0, entryFee);
  const fromWin = entryFee - fromDep;

  await db.collection(walletsCollection).updateOne(
    { userId: { $regex: new RegExp(`^${uId}$`, 'i') } },
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
    const tierFees = { micro: 1, rookie: 5, pro: 20, elite: 50 };
    const entryFee = tierFees[normTierName] || 5;

    // Case-insensitive wallet lookup: the queue normalizes userIds to lowercase,
    // but wallets may have been stored with the original mixed-case userId.
    const wallet = await db.collection(this.walletsCollection).findOne({
      userId: { $regex: new RegExp(`^${normUserId}$`, 'i') }
    });
    if (!wallet) {
      throw new Error('Wallet not found for user. Please ensure your account is fully set up.');
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

    // Load platform settings to check the gameMode
    const settings = await db.collection('settings').findOne({ key: 'platform_settings' });
    const gameMode = settings?.value?.gameMode || 'pvp';

    let opponent = null;
    if (gameMode === 'pvs') {
      // Generate a realistic random human name for the virtual opponent
      const firstNames = [
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
        'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
        'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Margaret',
        'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
        'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah', 'Timothy', 'Stephanie',
        'Ronald', 'Rebecca', 'Edward', 'Sharon', 'Jason', 'Laura', 'Jeffrey', 'Cynthia', 'Gregory', 'Kathleen',
        'Ryan', 'Amy', 'Jacob', 'Angela', 'Gary', 'Shirley', 'Nicholas', 'Brenda', 'Eric', 'Emma',
        'Jonathan', 'Anna', 'Stephen', 'Pamela', 'Larry', 'Nicole', 'Justin', 'Samantha', 'Scott', 'Katherine',
        'Brandon', 'Christine', 'Benjamin', 'Helen', 'Samuel', 'Debora', 'Rachel', 'Alexander', 'Carolyn', 'Patrick',
        'Janet', 'Jack', 'Maria', 'Zachary', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Virginia', 'Henry',
        'Julie', 'Jose', 'Joyce', 'Douglas', 'Victoria', 'Peter', 'Olivia', 'Adam', 'Kelly', 'Nathan',
        'Christina', 'Walter', 'Lauren', 'Kyle', 'Joan', 'Harold', 'Evelyn', 'Carl', 'Judith', 'Jeremy',
        'Megan', 'Keith', 'Cheryl', 'Roger', 'Andrea', 'Gerald', 'Hannah', 'Ethan', 'Jacqueline', 'Arthur',
        'Martha', 'Terry', 'Gloria', 'Christian', 'Teresa', 'Sean', 'Ann', 'Lawrence', 'Sara', 'Austin',
        'Madison', 'Joe', 'Frances', 'Noah', 'Kathryn', 'Jesse', 'Janice', 'Albert', 'Jean', 'Bryan',
        'Abigail', 'Billy', 'Alice', 'Bruce', 'Julia', 'Willie', 'Judy', 'Jordan', 'Sophia', 'Dylan',
        'Grace', 'Alan', 'Amber', 'Ralph', 'Denise', 'Gabriel', 'Danielle', 'Roy', 'Beverly', 'Louis',
        'Sherry', 'Russell', 'Kaylee', 'Vincent', 'Alexis', 'Philip', 'Tiffany', 'Bobby', 'Johnny', 'Hailey',
        'Bradley', 'Chloe', 'Mason', 'Liam', 'Harper', 'Lucas', 'Ella', 'Jackson', 'Avery', 'Mateo',
        'Layla', 'Luka', 'Luna', 'Oliver', 'Isabella', 'Leo', 'Mia', 'Enzo', 'Aria', 'Zoe'
      ];
      const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
        'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
        'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
        'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
        'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
        'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
        'Porter', 'Hunter', 'Salazar', 'Shaw', 'Gordon', 'Wilcox', 'Webb', 'Harrison', 'Coleman', 'West',
        'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Gibson', 'Mcdonald', 'Marshall', 'Murray', 'Freeman',
        'Wells', 'Simpson', 'Stevens', 'Tucker', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Kennedy',
        'Warren', 'Dixon', 'Burns', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer',
        'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson',
        'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis',
        'Ray', 'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane',
        'Andrews', 'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence', 'Elliott',
        'Franklin', 'Lawson', 'Beebe', 'George', 'Pearson', 'Gilbert', 'Montgomery', 'Harvey', 'Knight', 'Burke',
        'Oliver', 'Soto', 'Silva', 'Rosales', 'Frazier', 'Burton', 'Valenzuela', 'Bowman', 'Herrera', 'Aguilar'
      ];
      const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      const mockName = `${randomFirst} ${randomLast}`;

      opponent = {
        userId: 'system',
        name: mockName,
        socketId: null
      };
    } else {
      // atomic check-and-match — exclude self to prevent self-matching in edge cases, match same tier and game type
      opponent = await db.collection(this.queueCollection).findOneAndDelete({ 
        tier: normTierName, 
        gameType: normGameType, 
        userId: { $ne: normUserId } 
      });
    }

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

    // Only deduct wallet for real users, skip 'system'
    const deductUserIds = opponent.userId === 'system' ? [normUserId] : [opponent.userId, normUserId];
    await Promise.all(
      deductUserIds.map(uId =>
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

    const tierFees = { micro: 1, rookie: 5, pro: 20, elite: 50 };
    const entryFee = tierFees[normalizeKey(match.tier)] || 5;

    if (normWinnerId === 'tie' || normWinnerId === 'draw') {
      for (const pId of match.players) {
        if (pId === 'system') continue;
        await db.collection(this.walletsCollection).updateOne(
          { userId: { $regex: new RegExp(`^${pId}$`, 'i') } },
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
    if (normWinnerId !== 'system') {
      await db.collection(this.walletsCollection).updateOne(
        { userId: { $regex: new RegExp(`^${normWinnerId}$`, 'i') } },
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
    }

    // Settle loser: deduct locked balance
    if (loserId && loserId !== 'system') {
      await db.collection(this.walletsCollection).updateOne(
        { userId: { $regex: new RegExp(`^${loserId}$`, 'i') } },
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
