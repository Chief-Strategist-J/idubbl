import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';
import express from 'express';
import supertest from 'supertest';
import adminRouter from '../routes/admin.js';

// Create a mock Express application to test the admin routes locally
const app = express();
app.use(express.json());

// Set header to bypass auth using req.headers['x-user-id'] checked in adminAuth
app.use('/api/admin', adminRouter);

test('Admin Manual Top-up Flow Integration Test', async () => {
  const db = await getDb();
  
  const testUserId = 'test_topup_user_' + Date.now();
  const testAdminId = 'test_admin_id_' + Date.now();

  // Create an admin user in DB
  await db.collection('user').insertOne({
    id: testAdminId,
    email: `admin_${Date.now()}@example.com`,
    name: 'Test Admin User',
    role: 'admin',
    status: 'active',
    createdAt: new Date()
  });

  // Create a player user
  await db.collection('user').insertOne({
    id: testUserId,
    email: `topup_user_${Date.now()}@example.com`,
    name: 'Test Topup User',
    role: 'player',
    status: 'active',
    createdAt: new Date()
  });

  // Ensure there is a wallet
  await db.collection('wallets').insertOne({
    userId: testUserId,
    depositBalance: 50,
    winningsBalance: 10,
    lockedBalance: 0,
    pendingWithdrawals: 0
  });

  try {
    // 1. Test top-up of depositBalance
    const res1 = await supertest(app)
      .post(`/api/admin/users/${testUserId}/topup`)
      .set('x-user-id', testAdminId)
      .send({
        amount: 25.5,
        balanceType: 'depositBalance',
        reference: 'crypto_manual_confirm_123',
        notes: 'Confirmed manual crypto deposit'
      });

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.data.wallet.depositBalance, 75.5);
    assert.strictEqual(res1.body.data.wallet.winningsBalance, 10);

    // 2. Verify transaction record exists
    const tx = await db.collection('transactions').findOne({
      userId: testUserId,
      type: 'manual_topup',
      reference: 'crypto_manual_confirm_123'
    });
    assert.ok(tx, 'Manual topup transaction should be logged');
    assert.strictEqual(tx.amount, 25.5);
    assert.strictEqual(tx.balanceType, 'depositBalance');
    assert.strictEqual(tx.adminId, testAdminId);

    // 3. Test top-up of winningsBalance
    const res2 = await supertest(app)
      .post(`/api/admin/users/${testUserId}/topup`)
      .set('x-user-id', testAdminId)
      .send({
        amount: 15,
        balanceType: 'winningsBalance',
        reference: 'manual_win_bonus',
        notes: 'Admin bonus credit'
      });

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.success, true);
    assert.strictEqual(res2.body.data.wallet.winningsBalance, 25);

    // 4. Test invalid balance type validation
    const resInvalidType = await supertest(app)
      .post(`/api/admin/users/${testUserId}/topup`)
      .set('x-user-id', testAdminId)
      .send({
        amount: 10,
        balanceType: 'invalidBalanceType'
      });
    assert.strictEqual(resInvalidType.status, 400);

    // 5. Test invalid amount validation
    const resInvalidAmount = await supertest(app)
      .post(`/api/admin/users/${testUserId}/topup`)
      .set('x-user-id', testAdminId)
      .send({
        amount: -5,
        balanceType: 'depositBalance'
      });
    assert.strictEqual(resInvalidAmount.status, 400);

  } finally {
    // Clean up database modifications
    await db.collection('user').deleteMany({ id: { $in: [testUserId, testAdminId] } });
    await db.collection('wallets').deleteOne({ userId: testUserId });
    await db.collection('transactions').deleteMany({ userId: testUserId });
  }
});
