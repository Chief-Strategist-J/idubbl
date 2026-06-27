import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';

test('Integration Flow - Match Join Deduct and Settle', async () => {
  const db = await getDb();
  const testUserId = 'test_match_user_' + Date.now();
  const matchId = 'test_match_id_' + Date.now();
  const entryFee = 10;
  const prize = 18;
  const tier = 'Rookie';

  // 1. Ensure wallet exists with enough balance using upsert
  await db.collection('wallets').updateOne(
    { userId: testUserId },
    { $set: { depositBalance: 20, winningsBalance: 5, lockedBalance: 0, idubbuBalance: 25000 } },
    { upsert: true }
  );

  // 2. Simulate match join deduct logic
  const freshWallet = await db.collection('wallets').findOne({ userId: testUserId });
  assert.strictEqual(freshWallet.depositBalance, 20);
  assert.strictEqual(freshWallet.winningsBalance, 5);

  const total = freshWallet.depositBalance + freshWallet.winningsBalance;
  assert.ok(total >= entryFee);

  const fromDeposit = Math.min(freshWallet.depositBalance, entryFee);
  const fromWinnings = entryFee - fromDeposit;

  await db.collection('wallets').updateOne(
    { userId: testUserId },
    { $inc: {
        depositBalance: -fromDeposit,
        winningsBalance: -fromWinnings,
        lockedBalance: entryFee,
        idubbuBalance: -entryFee * 1000
    }}
  );

  await db.collection('transactions').insertOne({
    userId: testUserId, type: 'match_entry', amount: entryFee,
    matchId, tier, status: 'locked', createdAt: new Date()
  });

  // Verify wallet locked values
  const joinedWallet = await db.collection('wallets').findOne({ userId: testUserId });
  assert.strictEqual(joinedWallet.depositBalance, 10);
  assert.strictEqual(joinedWallet.winningsBalance, 5);
  assert.strictEqual(joinedWallet.lockedBalance, 10);
  assert.strictEqual(joinedWallet.idubbuBalance, 15000);

  // Verify entry transaction
  const entryTx = await db.collection('transactions').findOne({ userId: testUserId, type: 'match_entry', matchId });
  assert.ok(entryTx);
  assert.strictEqual(entryTx.status, 'locked');

  // 3. Simulate Settle Winner
  await db.collection('wallets').updateOne(
    { userId: testUserId },
    { $inc: {
        winningsBalance: prize,
        lockedBalance: -entryFee,
        idubbuBalance: prize * 1000
    }}
  );
  await db.collection('transactions').insertOne({
    userId: testUserId, type: 'win', amount: prize,
    matchId, tier, status: 'approved', createdAt: new Date()
  });

  const settledWallet = await db.collection('wallets').findOne({ userId: testUserId });
  assert.strictEqual(settledWallet.depositBalance, 10);
  assert.strictEqual(settledWallet.winningsBalance, 23); // 5 + 18
  assert.strictEqual(settledWallet.lockedBalance, 0);
  assert.strictEqual(settledWallet.idubbuBalance, 33000); // 15000 + 18000

  // Cleanup test data
  await db.collection('wallets').deleteOne({ userId: testUserId });
  await db.collection('transactions').deleteMany({ userId: testUserId });

  console.log('✓ Match join and settle validation integration test passed successfully!');
  process.exit(0);
});
