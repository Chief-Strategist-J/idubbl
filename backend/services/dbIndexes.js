import { getDb } from './db.js';

// Indexes for collections that were previously unindexed, causing full
// collection scans on every read as data grows (measured as the dominant
// cost on Atlas for hot paths like wallet balance and transaction history).
export async function initCoreIndexes() {
  const db = await getDb();

  await db.collection('user').createIndex({ id: 1 }, { unique: true });
  await db.collection('user').createIndex({ referralCode: 1 });
  await db.collection('user').createIndex({ referredBy: 1 });

  await db.collection('wallets').createIndex({ userId: 1 }, { unique: true });
  await db.collection('user_wallets').createIndex({ userId: 1 });

  await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('transactions').createIndex({ type: 1, createdAt: -1 });
  await db.collection('transactions').createIndex({ type: 1, status: 1 });
  await db.collection('transactions').createIndex({ refId: 1, status: 1 });
  await db.collection('transactions').createIndex({ matchId: 1, userId: 1, type: 1 });

  await db.collection('matches').createIndex({ matchId: 1, status: 1 });
  await db.collection('matches').createIndex({ startedAt: -1 });

  await db.collection('matchmaking_queue').createIndex({ userId: 1 });
  await db.collection('matchmaking_queue').createIndex({ socketId: 1 });

  await db.collection('settings').createIndex({ key: 1 }, { unique: true });
}
