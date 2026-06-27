import express from 'express';
import { getDb } from '../services/db.js';
import { errorRegistry } from '../services/errorRegistry.js';
import { authService, blockchainService } from '../services/index.js';

const router = express.Router();

const IDUBBU_RATE = 1000; // 1 USDT = 1000 Idubbu

async function getOrCreateWallet(db, userId) {
  let wallet = await db.collection('wallets').findOne({ userId });
  if (!wallet) {
    wallet = {
      userId,
      depositBalance: 1000,
      winningsBalance: 0,
      idubbuBalance: 1000 * IDUBBU_RATE,
      lockedBalance: 0,
      pendingWithdrawals: 0,
      createdAt: new Date(),
    };
    await db.collection('wallets').insertOne(wallet);
  } else {
    const updateQuery = { $set: {} };
    let updated = false;
    if (wallet.depositBalance === undefined) {
      updateQuery.$set.depositBalance = wallet.availableBalance ?? 0;
      updated = true;
    }
    if (wallet.winningsBalance === undefined) {
      updateQuery.$set.winningsBalance = 0;
      updated = true;
    }
    if (wallet.idubbuBalance === undefined) {
      updateQuery.$set.idubbuBalance = ((wallet.depositBalance || 0) + (wallet.winningsBalance || 0)) * IDUBBU_RATE;
      updated = true;
    }
    if (updated) {
      await db.collection('wallets').updateOne({ userId }, updateQuery);
      wallet = { ...wallet, ...updateQuery.$set };
    }
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
        depositBalance: wallet.depositBalance,
        winningsBalance: wallet.winningsBalance,
        idubbuBalance: wallet.idubbuBalance || 0,
        availableBalance: wallet.depositBalance + wallet.winningsBalance,
        lockedBalance: wallet.lockedBalance,
        pendingWithdrawals: wallet.pendingWithdrawals,
        idubbuRate: IDUBBU_RATE,
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

// 3a. Deduct entry fee when player joins a match
router.post('/match/join-deduct', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { entryFee, matchId, tier } = req.body;
  if (!entryFee) return errorRegistry.send(res, 'MISSING_ENTRY_FEE', 'Entry fee required.');
  try {
    const db = await getDb();
    const wallet = await getOrCreateWallet(db, userId);
    const total = (wallet.depositBalance || 0) + (wallet.winningsBalance || 0);
    if (total < Number(entryFee)) {
      return errorRegistry.send(res, 'INSUFFICIENT_BALANCE', 'Insufficient balance to join match.');
    }
    const fromDeposit  = Math.min(wallet.depositBalance || 0, Number(entryFee));
    const fromWinnings = Number(entryFee) - fromDeposit;
    await db.collection('wallets').updateOne(
      { userId },
      { $inc: {
          depositBalance:  -fromDeposit,
          winningsBalance: -fromWinnings,
          lockedBalance:    Number(entryFee),
          idubbuBalance:   -Number(entryFee) * IDUBBU_RATE
      }}
    );
    await db.collection('transactions').insertOne({
      userId, type: 'match_entry', amount: Number(entryFee),
      matchId, tier, status: 'locked', createdAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deducting entry fee:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error deducting entry fee.');
  }
});

// 3b. Settle match result — credit winner, record loss for loser
router.post('/match/settle', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { isWinner, prize, entryFee, matchId, tier, refId } = req.body;
  try {
    const db = await getDb();
    if (isWinner && prize > 0) {
      await db.collection('wallets').updateOne(
        { userId },
        { $inc: {
            winningsBalance: Number(prize),
            lockedBalance:  -Number(entryFee),
            idubbuBalance:   Number(prize) * IDUBBU_RATE
        }}
      );
      await db.collection('transactions').insertOne({
        userId, type: 'win', amount: Number(prize),
        matchId, tier, refId, status: 'approved', createdAt: new Date()
      });
    } else {
      await db.collection('wallets').updateOne(
        { userId },
        { $inc: { lockedBalance: -Number(entryFee) } }
      );
      await db.collection('transactions').insertOne({
        userId, type: 'loss', amount: Number(entryFee),
        matchId, tier, refId, status: 'approved', createdAt: new Date()
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error settling match:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error settling match.');
  }
});

// 3. Submit USDT Deposit (with Auto-Verification & Manual Fallback)
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

    // 1. Prevent replay/double spend attacks by checking if txHash was already submitted
    const existingTx = await db.collection('transactions').findOne({ txHash: txHash.trim() });
    if (existingTx) {
      return errorRegistry.send(res, 'TX_ALREADY_USED', 'This transaction hash has already been used.');
    }

    // 2. Perform Blockchain Verification via Hexagonal Adapter
    const verification = await blockchainService.verifyUSDTDeposit(txHash, network, Number(amount));

    if (verification.success) {
      // Auto-verified: credit wallet and save as approved immediately
      const newDeposit = {
        userId,
        amount: verification.amount || Number(amount),
        network,
        txHash,
        note: note ? `${note} (Auto-verified)` : 'Auto-verified',
        status: 'approved',
        type: 'deposit',
        verifiedAt: new Date(),
        createdAt: new Date(),
      };

      await db.collection('transactions').insertOne(newDeposit);

      await db.collection('wallets').updateOne(
        { userId },
        { $inc: { depositBalance: newDeposit.amount, idubbuBalance: newDeposit.amount * IDUBBU_RATE } }
      );

      return res.json({ success: true, autoVerified: true, idubbuCredited: newDeposit.amount * IDUBBU_RATE, data: newDeposit });
    } else {
      // Verification failed or pending: save as pending for manual admin review
      const newDeposit = {
        userId,
        amount: Number(amount),
        network,
        txHash,
        note: note ? `${note} (Auto-verify failed: ${verification.error})` : `Auto-verify failed: ${verification.error}`,
        status: 'pending',
        type: 'deposit',
        createdAt: new Date(),
      };

      await db.collection('transactions').insertOne(newDeposit);
      
      return res.json({ 
        success: true, 
        autoVerified: false, 
        data: newDeposit,
        warning: `Auto-verification failed: ${verification.error}. Saved for manual admin review.`
      });
    }

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
    return errorRegistry.send(res, 'MISSING_WITHDRAW_DETAILS', 'Amount, target address, and network are required.');
  }

  try {
    const db = await getDb();
    const wallet = await getOrCreateWallet(db, userId);

    const totalAvailable = wallet.winningsBalance || 0;
    if (totalAvailable < Number(amount)) {
      return errorRegistry.send(res, 'INSUFFICIENT_BALANCE', 'Insufficient winnings balance to complete the withdrawal.');
    }

    await db.collection('wallets').updateOne(
      { userId },
      {
        $inc: {
          winningsBalance: -Number(amount),
          pendingWithdrawals: Number(amount)
        }
      }
    );

    const newWithdrawal = {
      userId,
      amount: Number(amount),
      address,
      network,
      note: '',
      status: 'pending',
      type: 'withdrawal',
      createdAt: new Date(),
    };
    const result = await db.collection('transactions').insertOne(newWithdrawal);
    const id = result.insertedId.toString();
    res.json({ success: true, data: { ...newWithdrawal, id, _id: id } });
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
    const userIdHeader = req.headers['x-user-id'];
    let isAdmin = false;
    const db = await getDb();
    if (userIdHeader) {
      let dbUser = await db.collection('user').findOne({ id: userIdHeader });
      if (!dbUser && userIdHeader.length === 24) {
        try {
          dbUser = await db.collection('user').findOne({ _id: new ObjectId(userIdHeader) });
        } catch (err) {}
      }
      if (dbUser && dbUser.role === 'admin') {
        isAdmin = true;
      }
    }
    if (!isAdmin) {
      const sessionData = await authService.getSession(req);
      if (!sessionData || !sessionData.user || sessionData.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending deposit transaction not found.');
    }

    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', reviewedBy: 'admin1', approvedAt: new Date() } }
    );

    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { $inc: { depositBalance: tx.amount, idubbuBalance: tx.amount * IDUBBU_RATE } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving deposit:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error approving deposit.');
  }
});

router.post('/admin/deposit/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const userIdHeader = req.headers['x-user-id'];
    let isAdmin = false;
    const db = await getDb();
    if (userIdHeader) {
      let dbUser = await db.collection('user').findOne({ id: userIdHeader });
      if (!dbUser && userIdHeader.length === 24) {
        try {
          dbUser = await db.collection('user').findOne({ _id: new ObjectId(userIdHeader) });
        } catch (err) {}
      }
      if (dbUser && dbUser.role === 'admin') {
        isAdmin = true;
      }
    }
    if (!isAdmin) {
      const sessionData = await authService.getSession(req);
      if (!sessionData || !sessionData.user || sessionData.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

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

router.post('/admin/withdraw/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const userIdHeader = req.headers['x-user-id'];
    let isAdmin = false;
    const db = await getDb();
    if (userIdHeader) {
      let dbUser = await db.collection('user').findOne({ id: userIdHeader });
      if (!dbUser && userIdHeader.length === 24) {
        try {
          dbUser = await db.collection('user').findOne({ _id: new ObjectId(userIdHeader) });
        } catch (err) {}
      }
      if (dbUser && dbUser.role === 'admin') {
        isAdmin = true;
      }
    }
    if (!isAdmin) {
      const sessionData = await authService.getSession(req);
      if (!sessionData || !sessionData.user || sessionData.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending withdrawal not found.');
    }

    const payout = await blockchainService.sendOnchainUSDT(tx.address, tx.amount, tx.network);
    if (!payout.success) {
      return res.status(400).json({ success: false, error: 'On-chain payout failed: ' + payout.error });
    }

    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', reviewedBy: 'admin1', paidAt: new Date(), payoutTxHash: payout.txHash } }
    );

    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { $inc: { pendingWithdrawals: -tx.amount } }
    );

    res.json({ success: true, payoutTxHash: payout.txHash });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error approving withdrawal.');
  }
});

router.post('/admin/withdraw/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');

  try {
    const userIdHeader = req.headers['x-user-id'];
    let isAdmin = false;
    const db = await getDb();
    if (userIdHeader) {
      let dbUser = await db.collection('user').findOne({ id: userIdHeader });
      if (!dbUser && userIdHeader.length === 24) {
        try {
          dbUser = await db.collection('user').findOne({ _id: new ObjectId(userIdHeader) });
        } catch (err) {}
      }
      if (dbUser && dbUser.role === 'admin') {
        isAdmin = true;
      }
    }
    if (!isAdmin) {
      const sessionData = await authService.getSession(req);
      if (!sessionData || !sessionData.user || sessionData.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

    const tx = await db.collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx || tx.status !== 'pending') {
      return errorRegistry.send(res, 'PENDING_TX_NOT_FOUND', 'Pending withdrawal not found.');
    }

    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'rejected', reviewedBy: 'admin1', rejectedAt: new Date() } }
    );

    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { 
        $inc: { 
          pendingWithdrawals: -tx.amount,
          winningsBalance: tx.amount 
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error rejecting withdrawal.');
  }
});

router.post('/personal/create', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  try {
    const db = await getDb();
    const keypair = blockchainService.generatePersonalWallet();
    
    await db.collection('user_wallets').updateOne(
      { userId },
      {
        $set: {
          tron: {
            address: keypair.tron.address,
            privateKey: keypair.tron.privateKey
          },
          ethereum: {
            address: keypair.ethereum.address,
            privateKey: keypair.ethereum.privateKey
          },
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    const clientData = {
      userId,
      tron: { address: keypair.tron.address },
      ethereum: { address: keypair.ethereum.address }
    };

    res.json({ success: true, data: clientData });
  } catch (error) {
    console.error('Error creating personal wallet:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error creating personal wallet.');
  }
});

router.get('/personal', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  try {
    const db = await getDb();
    const wallet = await db.collection('user_wallets').findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Personal wallets not generated yet.' });
    }

    res.json({
      success: true,
      data: {
        userId: wallet.userId,
        tron: { address: wallet.tron.address },
        ethereum: { address: wallet.ethereum.address }
      }
    });
  } catch (error) {
    console.error('Error fetching personal wallets:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error fetching personal wallets.');
  }
});

router.post('/personal/edit', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  const { tronAddress, ethereumAddress } = req.body;
  try {
    const db = await getDb();
    const updateFields = { updatedAt: new Date() };
    if (tronAddress) updateFields['tron.address'] = tronAddress;
    if (ethereumAddress) updateFields['ethereum.address'] = ethereumAddress;

    await db.collection('user_wallets').updateOne(
      { userId },
      { $set: updateFields },
      { upsert: true }
    );

    res.json({ success: true, message: 'Wallet addresses updated successfully.' });
  } catch (error) {
    console.error('Error editing personal wallets:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error editing personal wallets.');
  }
});

router.get('/personal/balance', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  try {
    const db = await getDb();
    const wallet = await db.collection('user_wallets').findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Personal wallets not found.' });
    }

    const [tronBalance, ethBalance, nativeTronBalance, nativeEthBalance] = await Promise.all([
      blockchainService.getOnchainUSDTBalance(wallet.tron.address, 'TRON'),
      blockchainService.getOnchainUSDTBalance(wallet.ethereum.address, 'ETHEREUM'),
      blockchainService.adapters.tron.getNativeBalance(wallet.tron.address),
      blockchainService.adapters.ethereum.getNativeBalance(wallet.ethereum.address)
    ]);

    res.json({
      success: true,
      data: {
        tron: { address: wallet.tron.address, balance: tronBalance, nativeBalance: nativeTronBalance },
        ethereum: { address: wallet.ethereum.address, balance: ethBalance, nativeBalance: nativeEthBalance }
      }
    });
  } catch (error) {
    console.error('Error fetching on-chain balances:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error checking on-chain balances.');
  }
});

router.delete('/personal', async (req, res) => {
  const userId = req.headers['x-user-id'] || 'u1';
  try {
    const db = await getDb();
    await db.collection('user_wallets').deleteOne({ userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting personal wallets:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error deleting personal wallets.');
  }
});

export default router;
