import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';
import { matchmakerService } from '../services/matchmakerService.js';

test('Matchmaker Integration Flow', async () => {
  const db = await getDb();
  const userId1 = 'mm_user_1_' + Date.now();
  const userId2 = 'mm_user_2_' + Date.now();
  const tier = 'Rookie';

  // Seed wallets
  await db.collection('wallets').updateOne(
    { userId: userId1 },
    { $set: { depositBalance: 20, winningsBalance: 5, lockedBalance: 0, idubbuBalance: 25000 } },
    { upsert: true }
  );
  await db.collection('wallets').updateOne(
    { userId: userId2 },
    { $set: { depositBalance: 30, winningsBalance: 0, lockedBalance: 0, idubbuBalance: 30000 } },
    { upsert: true }
  );

  // Matchmaking process for user 1
  const w1_before = await db.collection('wallets').findOne({ userId: userId1 });
  const result1 = await matchmakerService.findMatch(userId1, tier, 'socket_1');
  assert.strictEqual(result1.status, 'queued');

  // Verify User 1 balance is NOT locked/deducted yet (stays at 20 USDT)
  const w1_queued = await db.collection('wallets').findOne({ userId: userId1 });
  assert.strictEqual(w1_queued.depositBalance, w1_before.depositBalance);
  assert.strictEqual(w1_queued.lockedBalance, 0);

  // Verify user 1 in queue
  const queueEntry = await db.collection('matchmaking_queue').findOne({ userId: userId1 });
  assert.ok(queueEntry);

  // Matchmaking process for user 2 (triggers match + lock for both users)
  const result2 = await matchmakerService.findMatch(userId2, tier, 'socket_2');
  assert.strictEqual(result2.status, 'matched');
  assert.ok(result2.match);
  assert.strictEqual(result2.match.players.includes(userId1), true);
  assert.strictEqual(result2.match.players.includes(userId2), true);

  // Verify balances are locked now that match is found
  const w1_locked = await db.collection('wallets').findOne({ userId: userId1 });
  assert.strictEqual(w1_locked.depositBalance, 15); // 20 - 5
  assert.strictEqual(w1_locked.lockedBalance, 5);

  const w2_locked = await db.collection('wallets').findOne({ userId: userId2 });
  assert.strictEqual(w2_locked.depositBalance, 25); // 30 - 5
  assert.strictEqual(w2_locked.lockedBalance, 5);

  // Verify queue cleared
  const queueSize = await db.collection('matchmaking_queue').countDocuments();
  assert.strictEqual(queueSize, 0);

  // Settle game
  const settleResult = await matchmakerService.endMatch(result2.match.matchId, userId1, 9);
  assert.strictEqual(settleResult.success, true);

  // Check wallets
  const w1 = await db.collection('wallets').findOne({ userId: userId1 });
  assert.strictEqual(w1.depositBalance, 15); 
  assert.strictEqual(w1.winningsBalance, 14); // 5 + 9
  assert.strictEqual(w1.lockedBalance, 0);

  const w2 = await db.collection('wallets').findOne({ userId: userId2 });
  assert.strictEqual(w2.depositBalance, 25); 
  assert.strictEqual(w2.winningsBalance, 0);
  assert.strictEqual(w2.lockedBalance, 0);

  // Cleanup
  await db.collection('wallets').deleteMany({ userId: { $in: [userId1, userId2] } });
  await db.collection('transactions').deleteMany({ userId: { $in: [userId1, userId2] } });
  await db.collection('matches').deleteOne({ matchId: result2.match.matchId });

  console.log('✓ Matchmaker matchmaking integration flow test passed successfully!');
});
