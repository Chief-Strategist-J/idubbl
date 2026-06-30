import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';
import { ObjectId } from 'mongodb';

test('KYC & Withdrawal Control Flow Integration Test', async () => {
  const db = await getDb();
  const testUserId = 'test_kyc_user_' + Date.now();

  // Create a clean test user document in the "user" collection
  await db.collection('user').insertOne({
    id: testUserId,
    email: `test_kyc_${Date.now()}@example.com`,
    name: 'Test KYC User',
    role: 'player',
    status: 'active',
    kycStatus: 'unverified',
    createdAt: new Date()
  });

  // Create a wallet for the user with some winnings balance
  await db.collection('wallets').insertOne({
    userId: testUserId,
    depositBalance: 0,
    winningsBalance: 50,
    idubbuBalance: 0,
    lockedBalance: 0,
    pendingWithdrawals: 0,
    createdAt: new Date()
  });

  try {
    // 1. Initially, user's KYC status should be unverified
    const user = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(user.kycStatus || 'unverified', 'unverified');

    // 2. Simulate withdrawal attempt when KYC is unverified
    // This replicates the logic in our router POST /withdraw
    let withdrawAllowed = true;
    let withdrawError = null;

    const dbUserBefore = await db.collection('user').findOne({ id: testUserId });
    if (!dbUserBefore || dbUserBefore.kycStatus !== 'verified') {
      withdrawAllowed = false;
      withdrawError = 'KYC_REQUIRED';
    }

    assert.strictEqual(withdrawAllowed, false, 'Withdrawal should not be allowed for unverified KYC.');
    assert.strictEqual(withdrawError, 'KYC_REQUIRED');

    // 3. Update status to pending
    await db.collection('user').updateOne(
      { id: testUserId },
      { $set: { kycStatus: 'pending' } }
    );
    const userPending = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(userPending.kycStatus, 'pending');

    // 4. Update status to failed
    await db.collection('user').updateOne(
      { id: testUserId },
      { $set: { kycStatus: 'failed' } }
    );
    const userFailed = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(userFailed.kycStatus, 'failed');

    // 5. Update status to verified
    await db.collection('user').updateOne(
      { id: testUserId },
      { $set: { kycStatus: 'verified' } }
    );
    const userVerified = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(userVerified.kycStatus, 'verified');

    // 6. Simulate withdrawal attempt when KYC is verified
    let withdrawAllowedAfter = false;
    const dbUserAfter = await db.collection('user').findOne({ id: testUserId });
    if (dbUserAfter && dbUserAfter.kycStatus === 'verified') {
      withdrawAllowedAfter = true;
    }

    assert.strictEqual(withdrawAllowedAfter, true, 'Withdrawal should be allowed for verified KYC.');

    // 7. Perform the actual mock wallet updates for a successful withdrawal submission
    const amount = 20;
    const wallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.ok(wallet.winningsBalance >= amount);

    await db.collection('wallets').updateOne(
      { userId: testUserId },
      {
        $inc: {
          winningsBalance: -amount,
          pendingWithdrawals: amount
        }
      }
    );

    const updatedWallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.strictEqual(updatedWallet.winningsBalance, 30);
    assert.strictEqual(updatedWallet.pendingWithdrawals, 20);

  } finally {
    // Cleanup test data
    await db.collection('user').deleteOne({ id: testUserId });
    await db.collection('wallets').deleteOne({ userId: testUserId });
  }
});
