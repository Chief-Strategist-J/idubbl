import express from 'express';
import { getDb } from '../services/db.js';
import { errorRegistry } from '../services/errorRegistry.js';

const router = express.Router();

// Helper to get or create wallet for a user
async function getOrCreateWallet(db, userId) {
  let wallet = await db.collection('wallets').findOne({ userId });
  if (!wallet) {
    wallet = {
      userId,
      availableBalance: 1000, // Default signup balance
      lockedBalance: 5,
      pendingWithdrawals: 18,
      createdAt: new Date(),
    };
    await db.collection('wallets').insertOne(wallet);
  }
  return wallet;
}

// 1. Get Wallet Balance
router.get('/balance', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1'; // Fallback to demo user

  try {
    const db = await getDb();
    const wallet = await getOrCreateWallet(db, userId);
    res.json({
      success: true,
      data: {
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        pendingWithdrawals: wallet.pendingWithdrawals,
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error fetching balance.');
  }
});

// 2. Get Transactions List
router.get('/transactions', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';

  try {
    const db = await getDb();
    const transactions = await db.collection('transactions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error fetching transactions.');
  }
});

// 3. Submit Manual USDT Deposit
router.post('/deposit', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { amount, network, txHash, note } = req.body;

  if (!amount) {
    return errorRegistry.send(res, 'INVALID_AMOUNT', 'Amount is required to submit a deposit.');
  }
  if (!txHash) {
    return errorRegistry.send(res, 'MISSING_TX_HASH', 'Transaction hash is required.');
  }

  try {
    const db = await getDb();
    const newDeposit = {
      userId,
      amount: Number(amount),
      network,
      txHash,
      note,
      status: 'pending',
      type: 'deposit',
      createdAt: new Date(),
    };
    await db.collection('transactions').insertOne(newDeposit);
    res.json({ success: true, data: newDeposit });
  } catch (error) {
    console.error('Error submitting deposit:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error submitting deposit.');
  }
});

// 4. Submit Withdrawal Request
router.post('/withdraw', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { amount, address, network } = req.body;

  if (!amount || !address || !network) {
    return errorRegistry.send(res, 'MISSING_WITHDRAW_DETAILS', 'Amount, target address, and network are required to submit withdrawal.');
  }

  try {
    const db = await getDb();
    const wallet = await getOrCreateWallet(db, userId);

    if (wallet.availableBalance < Number(amount)) {
      return errorRegistry.send(res, 'INSUFFICIENT_FUNDS', 'Insufficient balance to complete the requested withdrawal.');
    }

    // Deduct available, increase pending
    await db.collection('wallets').updateOne(
      { userId },
      { 
        $inc: { 
          availableBalance: -Number(amount), 
          pendingWithdrawals: Number(amount) 
        } 
      }
    );

    const newWithdrawal = {
      userId,
      amount: Number(amount),
      address,
      network,
      status: 'pending',
      type: 'withdrawal',
      createdAt: new Date(),
    };
    await db.collection('transactions').insertOne(newWithdrawal);
    res.json({ success: true, data: newWithdrawal });
  } catch (error) {
    console.error('Error submitting withdrawal:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error submitting withdrawal.');
  }
});

// 5. Admin Approve Deposit
router.post('/admin/deposit/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const db = await getDb();
    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending deposit transaction not found.');
    }

    // Mark approved
    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', reviewedBy: 'admin1', approvedAt: new Date() } }
    );

    // Update wallet balance
    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { $inc: { availableBalance: tx.amount } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving deposit:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error approving deposit.');
  }
});

// 6. Admin Reject Deposit
router.post('/admin/deposit/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const db = await getDb();
    const result = await db.collection('transactions').updateOne(
      { _id: new ObjectId(id), status: 'pending' },
      { $set: { status: 'rejected', reviewedBy: 'admin1', rejectedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending deposit not found.');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting deposit:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error rejecting deposit.');
  }
});

// 7. Admin Approve Withdrawal
router.post('/admin/withdraw/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const db = await getDb();
    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending withdrawal not found.');
    }

    // Approve transaction
    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', reviewedBy: 'admin1', paidAt: new Date() } }
    );

    // Deduct pending balance
    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { $inc: { pendingWithdrawals: -tx.amount } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error approving withdrawal.');
  }
});

// 8. Admin Reject Withdrawal
router.post('/admin/withdraw/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const db = await getDb();
    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending withdrawal not found.');
    }

    // Mark transaction as rejected
    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'rejected', reviewedBy: 'admin1', rejectedAt: new Date() } }
    );

    // Return funds: deduct pending, credit available balance
    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { 
        $inc: { 
          pendingWithdrawals: -tx.amount,
          availableBalance: tx.amount 
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error rejecting withdrawal.');
  }
});

export default router;
