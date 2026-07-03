import { getDb } from './db.js';

// Indexes for collections that were previously unindexed, causing full
// collection scans on every read as data grows (measured as the dominant
// cost on Atlas for hot paths like wallet balance and transaction history).
// Not marked unique: existing production data has null/duplicate values in
// some of these fields, and enforcing uniqueness is a data-integrity change
// out of scope here — these indexes exist purely to speed up lookups.
const INDEX_SPECS = [
  ['user', { id: 1 }],
  ['user', { referralCode: 1 }],
  ['user', { referredBy: 1 }],

  ['wallets', { userId: 1 }],
  ['user_wallets', { userId: 1 }],

  ['transactions', { userId: 1, createdAt: -1 }],
  ['transactions', { type: 1, createdAt: -1 }],
  ['transactions', { type: 1, status: 1 }],
  ['transactions', { refId: 1, status: 1 }],
  ['transactions', { matchId: 1, userId: 1, type: 1 }],

  ['matches', { matchId: 1, status: 1 }],
  ['matches', { startedAt: -1 }],

  ['matchmaking_queue', { userId: 1 }],
  ['matchmaking_queue', { socketId: 1 }],

  ['settings', { key: 1 }],
];

export async function initCoreIndexes() {
  const db = await getDb();

  for (const [collection, spec] of INDEX_SPECS) {
    try {
      await db.collection(collection).createIndex(spec);
    } catch (err) {
      console.error(`Failed to create index ${JSON.stringify(spec)} on ${collection}:`, err.message);
    }
  }
}
