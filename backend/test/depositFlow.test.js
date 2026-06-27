import { test } from 'node:test';
import assert from 'node:assert';
import { blockchainService } from '../services/index.js';
import { getDb } from '../services/db.js';

test('Integration Flow - Personal Wallet Creation and Deposit Submission', async () => {
  const db = await getDb();
  const testUserId = 'test_flow_user_' + Date.now();

  // 1. Generate personal wallet addresses (Upsert Flow)
  const keypair = blockchainService.generatePersonalWallet();
  assert.ok(keypair.tron.address);
  assert.ok(keypair.ethereum.address);

  await db.collection('user_wallets').updateOne(
    { userId: testUserId },
    {
      $set: {
        tron: { address: keypair.tron.address, privateKey: keypair.tron.privateKey },
        ethereum: { address: keypair.ethereum.address, privateKey: keypair.ethereum.privateKey },
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  // Verify wallet exists in DB
  const storedWallet = await db.collection('user_wallets').findOne({ userId: testUserId });
  assert.strictEqual(storedWallet.tron.address, keypair.tron.address);

  // 2. Submit Deposit matching generated wallet
  const txHash = 'test_hash_' + Date.now();
  const depositAmount = 25;
  const network = 'TRC20 (TRON)';

  // Verify transaction status uniqueness
  const existingTx = await db.collection('transactions').findOne({ txHash });
  assert.strictEqual(existingTx, null);

  // Attempt verification (will fallback to pending during testing since txHash is mock)
  const verification = await blockchainService.verifyUSDTDeposit(txHash, network, depositAmount);
  assert.strictEqual(verification.success, false); // Expected mock failure

  // Create pending deposit transaction fallback
  const newDeposit = {
    userId: testUserId,
    amount: depositAmount,
    network,
    txHash,
    status: 'pending',
    type: 'deposit',
    createdAt: new Date(),
  };

  await db.collection('transactions').insertOne(newDeposit);

  // Verify transaction was saved successfully
  const savedTx = await db.collection('transactions').findOne({ txHash });
  assert.strictEqual(savedTx.userId, testUserId);
  assert.strictEqual(savedTx.amount, depositAmount);
  assert.strictEqual(savedTx.status, 'pending');

  // Cleanup test data
  await db.collection('user_wallets').deleteOne({ userId: testUserId });
  await db.collection('transactions').deleteOne({ txHash });
});
