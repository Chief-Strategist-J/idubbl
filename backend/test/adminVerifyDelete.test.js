import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';
import express from 'express';
import supertest from 'supertest';
import adminRouter from '../routes/admin.js';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

test('Admin Verify and Delete Flow Integration Test', async () => {
  const db = await getDb();
  
  const testUserId = 'test_verify_delete_user_' + Date.now();
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
    email: `player_${Date.now()}@example.com`,
    name: 'Test Player User',
    role: 'player',
    status: 'active',
    kycStatus: 'unverified',
    createdAt: new Date()
  });

  // Create user wallet records
  await db.collection('wallets').insertOne({
    userId: testUserId,
    depositBalance: 10,
    winningsBalance: 5,
    lockedBalance: 0,
    pendingWithdrawals: 0
  });

  try {
    // 1. Verify a user manually
    const verifyRes = await supertest(app)
      .post(`/api/admin/users/${testUserId}/verify`)
      .set('x-user-id', testAdminId)
      .send();

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.success, true);

    const verifiedUser = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(verifiedUser.kycStatus, 'verified', 'User KYC Status should be updated to verified');
    assert.strictEqual(verifiedUser.kycDetails.manual, true, 'User KYC Details should flag manual verification');

    // 2. Delete the user
    const deleteRes = await supertest(app)
      .delete(`/api/admin/users/${testUserId}`)
      .set('x-user-id', testAdminId)
      .send();

    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.body.success, true);

    // Verify record deletion
    const deletedUser = await db.collection('user').findOne({ id: testUserId });
    assert.strictEqual(deletedUser, null, 'User document should be completely deleted');

    const deletedWallet = await db.collection('wallets').findOne({ userId: testUserId });
    assert.strictEqual(deletedWallet, null, 'Wallet document should be completely deleted');

  } finally {
    // Clean up
    await db.collection('user').deleteMany({ id: { $in: [testUserId, testAdminId] } });
    await db.collection('wallets').deleteOne({ userId: testUserId });
  }
});
