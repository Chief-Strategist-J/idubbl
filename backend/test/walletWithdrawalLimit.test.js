import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';
import express from 'express';
import supertest from 'supertest';
import walletRouter from '../routes/wallet.js';

const app = express();
app.use(express.json());
app.use('/api/wallet', walletRouter);

test('Wallet Withdrawal and Settlement Limits', async () => {
  const db = await getDb();
  
  const testUserId = 'test_withdrawal_user_' + Date.now();

  // Create test user and verify KYC (since KYC config could be required)
  await db.collection('user').insertOne({
    id: testUserId,
    email: `withdraw_${Date.now()}@example.com`,
    name: 'Test Withdraw User',
    role: 'player',
    status: 'active',
    kycStatus: 'verified',
    createdAt: new Date()
  });

  // Ensure wallet exists with balance
  await db.collection('wallets').insertOne({
    userId: testUserId,
    depositBalance: 20,
    winningsBalance: 15,
    lockedBalance: 0,
    pendingWithdrawals: 0,
    idubbuBalance: 20000
  });

  // Ensure KYC settings is set to kycRequired: false for ease of test in this runner
  await db.collection('settings').updateOne(
    { key: 'kyc_config' },
    { $set: { value: { kycRequired: false } } },
    { upsert: true }
  );

  try {
    // 1. Submit withdrawal of 0.5 USDT (should fail validation because < 1 USDT)
    const rejectRes = await supertest(app)
      .post('/api/wallet/withdraw')
      .set('x-user-id', testUserId)
      .send({
        amount: 0.5,
        address: 'TTestWalletAddress123',
        network: 'TRC20',
        currency: 'USDT'
      });

    assert.strictEqual(rejectRes.status, 400);
    assert.strictEqual(rejectRes.body.success, false);
    assert.strictEqual(rejectRes.body.code, 'INVALID_AMOUNT');

    // 2. Submit withdrawal of 1 USDT (should pass validation)
    const acceptRes = await supertest(app)
      .post('/api/wallet/withdraw')
      .set('x-user-id', testUserId)
      .send({
        amount: 1,
        address: 'TTestWalletAddress123',
        network: 'TRC20',
        currency: 'USDT'
      });

    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.success, true);
    assert.strictEqual(acceptRes.body.data.amount, 1);

    // Verify wallet winningsBalance decremented and pendingWithdrawals incremented
    const updatedWallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.strictEqual(updatedWallet.winningsBalance, 14);
    assert.strictEqual(updatedWallet.pendingWithdrawals, 1);

    // 3. Test settlement: Tie refund
    // Deduct entry fee to lock it first
    await supertest(app)
      .post('/api/wallet/match/join-deduct')
      .set('x-user-id', testUserId)
      .send({
        entryFee: 5,
        matchId: 'm_test_tie_1',
        tier: 'Rookie'
      });

    const lockedWallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.strictEqual(lockedWallet.depositBalance, 15);
    assert.strictEqual(lockedWallet.lockedBalance, 5);

    // Settle as tie (should refund fee back to depositBalance)
    const tieRes = await supertest(app)
      .post('/api/wallet/match/settle')
      .set('x-user-id', testUserId)
      .send({
        entryFee: 5,
        matchId: 'm_test_tie_1',
        isTie: true,
        isWinner: false,
        tier: 'Rookie'
      });

    assert.strictEqual(tieRes.status, 200);
    assert.strictEqual(tieRes.body.success, true);

    const refundedWallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.strictEqual(refundedWallet.depositBalance, 20, 'Locked funds should be returned to deposit balance on tie');
    assert.strictEqual(refundedWallet.lockedBalance, 0, 'Locked balance should be cleared');

  } finally {
    // Clean up
    await db.collection('user').deleteMany({ id: testUserId });
    await db.collection('wallets').deleteOne({ userId: testUserId });
    await db.collection('transactions').deleteMany({ userId: testUserId });
  }
});
