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
      depositBalance: 0,
      winningsBalance: 0,
      idubbuBalance: 0,
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

// Helper middleware or extractor to retrieve userId from session or headers
async function getUserIdFromReq(req) {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) return userIdHeader;

    const sessionData = await authService.getSession(req);
    if (sessionData && sessionData.user) {
      return sessionData.user.id || sessionData.user._id?.toString();
    }
  } catch (error) {
    console.error('Error fetching userId from request session:', error);
  }
  return 'u1'; // Fallback for testing/demo
}

// 1. Get Wallet Balance
router.get('/balance', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();
    const wallet = await getOrCreateWallet(db, userId);
    res.json({
      success: true,
      data: {
        depositBalance: wallet.depositBalance,
        winningsBalance: wallet.winningsBalance,
        idubbuBalance: wallet.idubbuBalance || 0,
        availableBalance: wallet.depositBalance + wallet.winningsBalance,
        lockedBalance: Math.max(0, wallet.lockedBalance || 0),
        pendingWithdrawals: wallet.pendingWithdrawals,
        idubbuRate: IDUBBU_RATE,
      }
    });
});

// 1.2 Get Referral System Details
router.get('/referrals', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();
    const { ObjectId } = await import('mongodb');

    // Look up current user to fetch referralCode
    let userQuery = { id: userId };
    try {
      userQuery = { $or: [{ id: userId }, { _id: new ObjectId(userId) }] };
    } catch (_) {}

    const currentUser = await db.collection('user').findOne(userQuery);
    if (!currentUser) {
      return res.json({ success: true, referralCode: '', referrals: [] });
    }

    const referralCode = currentUser.referralCode || '';

    // Find all users referred by this user
    const referredUsers = await db.collection('user').find({ referredBy: referralCode }).toArray();

    const referrals = [];
    for (const refUser of referredUsers) {
      const refUserId = refUser.id || refUser._id?.toString();

      // Check if referred user funded their wallet (at least one approved deposit transaction)
      const hasFunded = await db.collection('transactions').findOne({
        userId: refUserId,
        type: 'deposit',
        status: 'approved'
      });

      referrals.push({
        id: refUserId,
        name: refUser.name,
        email: refUser.email,
        funded: !!hasFunded,
        joinedAt: refUser.createdAt
      });
    }

    res.json({
      success: true,
      referralCode,
      referrals
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Database error fetching referrals.' });
  }
});

// 2. Get Transactions List
router.get('/transactions', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
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
  const { entryFee, matchId, tier } = req.body;
  if (!entryFee) return errorRegistry.send(res, 'MISSING_ENTRY_FEE', 'Entry fee required.');
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();

    // ── Idempotency guard: prevent double-charge for same match ───────────────
    if (matchId) {
      const alreadyCharged = await db.collection('transactions').findOne({
        userId, matchId, type: 'match_entry'
      });
      if (alreadyCharged) {
        return res.json({ success: true, alreadyDeducted: true });
      }
    }

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

// 3b. Settle match result — credit winner, record loss for loser, or refund for tie
// NOTE: prize is NOT trusted from client — always re-derived from the match record in DB
router.post('/match/settle', async (req, res) => {
  const { isWinner, isTie, entryFee, matchId, tier, refId } = req.body;
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();
    // Idempotency guard — reject duplicate settle calls for the same match
    const resolvedMatchId = matchId || refId;
    if (resolvedMatchId) {
      const existing = await db.collection('transactions').findOne({
        matchId: resolvedMatchId, userId, type: { $in: ['win', 'loss', 'refund'] }
      });
      if (existing) return res.json({ success: true, alreadySettled: true });
    }

    // Re-derive the authoritative prize from the DB match record — NEVER trust client prize
    let derivedPrize = 0;
    let actualIsTie = isTie || false;

    if (resolvedMatchId) {
      const matchRecord = await db.collection('matches').findOne({ matchId: resolvedMatchId });
      if (matchRecord) {
        if (matchRecord.winner === 'tie' || matchRecord.winner === 'draw') {
          actualIsTie = true;
        }
        if (isWinner && !actualIsTie) {
          const tierFees = { rookie: 5, pro: 20, elite: 50 };
          const normTier = (matchRecord.tier || tier || '').toLowerCase().trim();
          const fee = tierFees[normTier] || (entryFee ? Number(entryFee) : 5);
          derivedPrize = fee * 2 * 0.80; // 20% platform rake
        }
      } else if (isWinner && entryFee) {
        // Fallback: match record not found — use client entryFee (still safer than client prize)
        derivedPrize = Number(entryFee) * 2 * 0.80;
      }
    } else if (isWinner && entryFee) {
      derivedPrize = Number(entryFee) * 2 * 0.80;
    }

    const fee = entryFee ? Number(entryFee) : 0;

    if (isWinner && derivedPrize > 0 && !actualIsTie) {
      await db.collection('wallets').updateOne(
        { userId },
        { $inc: {
            winningsBalance: derivedPrize,
            lockedBalance:  -fee,
            idubbuBalance:   derivedPrize * IDUBBU_RATE
        }}
      );
      await db.collection('transactions').insertOne({
        userId, type: 'win', amount: derivedPrize,
        matchId: resolvedMatchId, tier, refId, status: 'approved', createdAt: new Date()
      });
    } else if (actualIsTie) {
      await db.collection('wallets').updateOne(
        { userId },
        { $inc: {
            depositBalance: fee,
            lockedBalance:  -fee,
            idubbuBalance:   fee * IDUBBU_RATE
        }}
      );
      await db.collection('transactions').insertOne({
        userId, type: 'refund', amount: fee,
        matchId: resolvedMatchId, tier, refId, status: 'approved', createdAt: new Date()
      });
    } else {
      await db.collection('wallets').updateOne(
        { userId },
        { $inc: { lockedBalance: -fee } }
      );
      await db.collection('transactions').insertOne({
        userId, type: 'loss', amount: fee,
        matchId: resolvedMatchId, tier, refId, status: 'approved', createdAt: new Date()
      });
    }
    res.json({ success: true, prize: derivedPrize, isTie: actualIsTie });
  } catch (error) {
    console.error('Error settling match:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error settling match.');
  }
});

// 3. Submit USDT Deposit (with Auto-Verification & Manual Fallback)
router.post('/deposit', async (req, res) => {
  const { amount, network, txHash, note } = req.body;

  if (!amount) {
    return errorRegistry.send(res, 'INVALID_AMOUNT', 'Amount is required to submit a deposit.');
  }
  if (!txHash) {
    return errorRegistry.send(res, 'MISSING_TX_HASH', 'Transaction hash is required.');
  }

  try {
    const userId = await getUserIdFromReq(req);
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
  const { amount, address, network } = req.body;

  if (!amount || !address || !network) {
    return errorRegistry.send(res, 'MISSING_WITHDRAW_DETAILS', 'Amount, target address, and network are required.');
  }

  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();

    // Check user KYC status before allowing withdrawal
    const { ObjectId } = await import('mongodb');
    let dbUser = await db.collection('user').findOne({ id: userId });
    if (!dbUser && userId.length === 24) {
      try {
        dbUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      } catch (err) {}
    }

    if (!dbUser || dbUser.kycStatus !== 'verified') {
      return errorRegistry.send(res, 'KYC_REQUIRED', 'KYC verification is required before withdrawing funds.');
    }

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
      { 
        $inc: { depositBalance: tx.amount, idubbuBalance: tx.amount * IDUBBU_RATE },
        $setOnInsert: {
          winningsBalance: 0,
          lockedBalance: 0,
          pendingWithdrawals: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
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

    let payoutTxHash = '';
    if (tx.network === 'FLUTTERWAVE') {
      let bankCode = '044';
      let accountNumber = tx.address;
      try {
        if (tx.address.startsWith('{')) {
          const details = JSON.parse(tx.address);
          bankCode = details.bankCode;
          accountNumber = details.accountNumber;
        }
      } catch (e) {}

      try {
        const { paymentRegistry } = await import('../services/payment/PaymentRegistry.js');
        const flwDriver = paymentRegistry.drivers.has('flutterwave') ? paymentRegistry.getActive() : null;
        if (flwDriver && typeof flwDriver.initiateTransfer === 'function') {
          const transferResult = await flwDriver.initiateTransfer({
            bankCode,
            accountNumber,
            amount: tx.amount,
            reference: `pay_${id}`
          });
          payoutTxHash = transferResult.transferId;
        } else {
          payoutTxHash = `manual_flw_${id}`;
        }
      } catch (err) {
        console.error('Flutterwave transfer error:', err);
        return res.status(400).json({ success: false, error: 'Flutterwave payout failed: ' + err.message });
      }
    } else {
      const payout = await blockchainService.sendOnchainUSDT(tx.address, tx.amount, tx.network);
      if (!payout.success) {
        return res.status(400).json({ success: false, error: 'On-chain payout failed: ' + payout.error });
      }
      payoutTxHash = payout.txHash;
    }

    await db.collection('transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', reviewedBy: 'admin1', paidAt: new Date(), payoutTxHash: payoutTxHash } }
    );

    await db.collection('wallets').updateOne(
      { userId: tx.userId },
      { $inc: { pendingWithdrawals: -tx.amount } }
    );

    res.json({ success: true, payoutTxHash });
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
  try {
    const userId = await getUserIdFromReq(req);
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
      tron: { address: keypair.tron.address, privateKey: keypair.tron.privateKey },
      ethereum: { address: keypair.ethereum.address, privateKey: keypair.ethereum.privateKey }
    };

    res.json({ success: true, data: clientData });
  } catch (error) {
    console.error('Error creating personal wallet:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error creating personal wallet.');
  }
});

router.get('/personal', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();
    const wallet = await db.collection('user_wallets').findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Personal wallets not generated yet.' });
    }

    const tronHost = process.env.TRONGRID_BASE_URL || 'https://api.trongrid.io';
    const isTronTestnet = tronHost.includes('shasta') || tronHost.includes('nile');
    const tronExplorer = isTronTestnet ? 'https://shasta.tronscan.org' : 'https://tronscan.org';

    const ethHost = process.env.ETH_PROVIDER_URL || '';
    const isEthTestnet = ethHost.includes('sepolia') || ethHost.includes('goerli');
    const ethExplorer = isEthTestnet ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';

    res.json({
      success: true,
      data: {
        userId: wallet.userId,
        tron: { address: wallet.tron.address, privateKey: wallet.tron.privateKey, explorerBase: tronExplorer },
        ethereum: { address: wallet.ethereum.address, privateKey: wallet.ethereum.privateKey, explorerBase: ethExplorer }
      }
    });
  } catch (error) {
    console.error('Error fetching personal wallets:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error fetching personal wallets.');
  }
});

router.post('/personal/edit', async (req, res) => {
  const { tronAddress, ethereumAddress } = req.body;
  try {
    const userId = await getUserIdFromReq(req);
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
  try {
    const userId = await getUserIdFromReq(req);
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

    const tronHost = process.env.TRONGRID_BASE_URL || 'https://api.trongrid.io';
    const isTronTestnet = tronHost.includes('shasta') || tronHost.includes('nile');
    const tronExplorer = isTronTestnet ? 'https://shasta.tronscan.org' : 'https://tronscan.org';

    const ethHost = process.env.ETH_PROVIDER_URL || '';
    const isEthTestnet = ethHost.includes('sepolia') || ethHost.includes('goerli');
    const ethExplorer = isEthTestnet ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';

    res.json({
      success: true,
      data: {
        tron: { address: wallet.tron.address, balance: tronBalance, nativeBalance: nativeTronBalance, explorerBase: tronExplorer },
        ethereum: { address: wallet.ethereum.address, balance: ethBalance, nativeBalance: nativeEthBalance, explorerBase: ethExplorer }
      }
    });
  } catch (error) {
    console.error('Error fetching on-chain balances:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error checking on-chain balances.');
  }
});

router.delete('/personal', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();
    await db.collection('user_wallets').deleteOne({ userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting personal wallets:', error);
    return errorRegistry.send(res, 'DATABASE_ERROR', 'Database error deleting personal wallets.');
  }
});

export default router;
