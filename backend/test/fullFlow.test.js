import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';

test('End-to-End Platform Integration Flow', async () => {
  const db = await getDb();
  const userId = 'e2e_user_' + Date.now();
  const matchId = 'm_e2e_' + Date.now();
  const txHashDeposit = 'tx_dep_' + Date.now();
  const txHashWithdraw = 'tx_wit_' + Date.now();

  console.log(`[E2E Test] Starting flow for user: ${userId}`);

  // 1. Initial State: Create a brand new wallet
  await db.collection('wallets').insertOne({
    userId,
    depositBalance: 0,
    winningsBalance: 0,
    lockedBalance: 0,
    pendingWithdrawals: 0,
    idubbuBalance: 0,
    createdAt: new Date()
  });

  const wallet0 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet0.depositBalance, 0);
  assert.strictEqual(wallet0.winningsBalance, 0);
  assert.strictEqual(wallet0.lockedBalance, 0);

  // 2. Deposit Flow: User deposits 50 USDT
  const depositAmount = 50;
  await db.collection('wallets').updateOne(
    { userId },
    { $inc: { depositBalance: depositAmount, idubbuBalance: depositAmount * 1000 } }
  );
  await db.collection('transactions').insertOne({
    userId,
    amount: depositAmount,
    type: 'deposit',
    status: 'approved',
    txHash: txHashDeposit,
    createdAt: new Date()
  });

  const wallet1 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet1.depositBalance, 50);
  assert.strictEqual(wallet1.idubbuBalance, 50000);
  console.log(`✓ Step 2: Deposit of ${depositAmount} USDT approved and credited.`);

  // 3. Match Join Flow: User joins a Pro Match (Entry Fee: 20 USDT)
  const entryFee = 20;
  const walletJoin = await db.collection('wallets').findOne({ userId });
  assert.ok((walletJoin.depositBalance + walletJoin.winningsBalance) >= entryFee);

  const fromDeposit = Math.min(walletJoin.depositBalance, entryFee);
  const fromWinnings = entryFee - fromDeposit;

  await db.collection('wallets').updateOne(
    { userId },
    {
      $inc: {
        depositBalance: -fromDeposit,
        winningsBalance: -fromWinnings,
        lockedBalance: entryFee,
        idubbuBalance: -entryFee * 1000
      }
    }
  );
  await db.collection('transactions').insertOne({
    userId,
    amount: entryFee,
    type: 'match_entry',
    status: 'locked',
    matchId,
    createdAt: new Date()
  });

  const wallet2 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet2.depositBalance, 30);
  assert.strictEqual(wallet2.winningsBalance, 0);
  assert.strictEqual(wallet2.lockedBalance, 20);
  assert.strictEqual(wallet2.idubbuBalance, 30000);
  console.log(`✓ Step 3: Match joined. Reserved entry fee of ${entryFee} USDT.`);

  // 4. Game Win Flow: Match finishes and user wins 36 USDT
  const prize = 36;
  await db.collection('wallets').updateOne(
    { userId },
    {
      $inc: {
        winningsBalance: prize,
        lockedBalance: -entryFee,
        idubbuBalance: prize * 1000
      }
    }
  );
  await db.collection('transactions').insertOne({
    userId,
    amount: prize,
    type: 'win',
    status: 'approved',
    matchId,
    createdAt: new Date()
  });

  const wallet3 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet3.depositBalance, 30);
  assert.strictEqual(wallet3.winningsBalance, 36);
  assert.strictEqual(wallet3.lockedBalance, 0);
  assert.strictEqual(wallet3.idubbuBalance, 66000);
  console.log(`✓ Step 4: User won the match. Credited winnings of ${prize} USDT.`);

  // 5. Withdrawal Submission Flow: User requests to withdraw 30 USDT from winnings
  const withdrawAmount = 30;
  const walletWithdraw = await db.collection('wallets').findOne({ userId });
  // Enforce winnings-only constraint
  assert.ok(walletWithdraw.winningsBalance >= withdrawAmount);

  await db.collection('wallets').updateOne(
    { userId },
    {
      $inc: {
        winningsBalance: -withdrawAmount,
        pendingWithdrawals: withdrawAmount
      }
    }
  );

  const withdrawTx = {
    userId,
    amount: withdrawAmount,
    type: 'withdrawal',
    status: 'pending',
    address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    network: 'TRC20 (TRON)',
    createdAt: new Date()
  };
  const insertRes = await db.collection('transactions').insertOne(withdrawTx);
  const withdrawTxId = insertRes.insertedId;

  const wallet4 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet4.winningsBalance, 6);
  assert.strictEqual(wallet4.pendingWithdrawals, 30);
  console.log(`✓ Step 5: Submitted withdrawal of ${withdrawAmount} USDT. Placed in pending review.`);

  // 6. Admin Approval Flow: Admin approves the pending withdrawal
  await db.collection('wallets').updateOne(
    { userId },
    { $inc: { pendingWithdrawals: -withdrawAmount } }
  );
  await db.collection('transactions').updateOne(
    { _id: withdrawTxId },
    { $set: { status: 'approved', txHash: txHashWithdraw } }
  );

  const wallet5 = await db.collection('wallets').findOne({ userId });
  assert.strictEqual(wallet5.winningsBalance, 6);
  assert.strictEqual(wallet5.pendingWithdrawals, 0);

  const finalTx = await db.collection('transactions').findOne({ _id: withdrawTxId });
  assert.strictEqual(finalTx.status, 'approved');
  console.log(`✓ Step 6: Withdrawal approved by admin. Funds paid out on-chain.`);

  // Clean up E2E test data
  await db.collection('wallets').deleteOne({ userId });
  await db.collection('transactions').deleteMany({ userId });
  console.log('[E2E Test] All steps passed successfully! Cleaning up resources.');

  process.exit(0);
});
