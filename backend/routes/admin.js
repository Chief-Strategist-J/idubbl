import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/db.js';
import { authService } from '../services/index.js';

const router = express.Router();

async function adminAuth(req, res, next) {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) {
      const db = await getDb();
      let dbUser = await db.collection('user').findOne({ id: userIdHeader });
      if (!dbUser) {
        try {
          const query = userIdHeader.length === 24 
            ? { $or: [{ _id: new ObjectId(userIdHeader) }, { _id: userIdHeader }] }
            : { _id: userIdHeader };
          dbUser = await db.collection('user').findOne(query);
        } catch (err) {}
      }
      if (dbUser && dbUser.role === 'admin') {
        req.user = dbUser;
        return next();
      }
    }

    const sessionData = await authService.getSession(req);
    if (!sessionData || !sessionData.user) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    if (sessionData.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = sessionData.user;
    req.session = sessionData.session;
    next();
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return res.status(500).json({ error: 'Internal server error validating authorization' });
  }
}

// 1. GET /api/admin/deposits - List all user deposits (pending, approved, rejected)
router.get('/deposits', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    
    // Fetch all users to map user information
    const users = await db.collection('user').find({}).toArray();
    const userMap = {};
    users.forEach(u => {
      const id = u.id || u._id.toString();
      userMap[id] = u;
    });

    const deposits = await db.collection('transactions')
      .find({ type: 'deposit' })
      .sort({ createdAt: -1 })
      .toArray();

    const enrichedDeposits = deposits.map(d => {
      const user = userMap[d.userId];
      const name = user ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'Unknown';
      return {
        ...d,
        id: d._id.toString(),
        user: name || user?.email || d.userId,
        userEmail: user?.email
      };
    });

    res.json({ success: true, data: enrichedDeposits });
  } catch (error) {
    console.error('Error fetching deposits admin:', error);
    res.status(500).json({ error: 'Database error fetching deposits' });
  }
});

router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('user').find({}).toArray();
    const userMap = {};
    users.forEach(u => {
      const id = u.id || u._id.toString();
      userMap[id] = u;
    });

    const withdrawals = await db.collection('transactions')
      .find({ type: 'withdrawal' })
      .sort({ createdAt: -1 })
      .toArray();

    const enrichedWithdrawals = withdrawals.map(w => {
      const user = userMap[w.userId];
      const name = user ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'Unknown';
      return {
        ...w,
        id: w._id.toString(),
        user: name || user?.email || w.userId,
        userEmail: user?.email
      };
    });

    res.json({ success: true, data: enrichedWithdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals admin:', error);
    res.status(500).json({ error: 'Database error fetching withdrawals' });
  }
});

// 3. GET /api/admin/users - Query all registered user profiles and balances
router.get('/users', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('user').find({}).toArray();
    const wallets = await db.collection('wallets').find({}).toArray();
    const personalWallets = await db.collection('user_wallets').find({}).toArray();

    const walletMap = {};
    wallets.forEach(w => {
      walletMap[w.userId] = w;
    });

    const personalWalletMap = {};
    personalWallets.forEach(pw => {
      personalWalletMap[pw.userId] = pw;
    });

    // 2. Fetch all approved deposit transactions to determine who has funded their wallets
    const approvedDeposits = await db.collection('transactions').find({ type: 'deposit', status: 'approved' }).toArray();
    const fundedUserMap = {};
    approvedDeposits.forEach(tx => {
      fundedUserMap[tx.userId] = true;
    });

    // 3. Map users to who referred them
    const referralsByReferralCode = {};
    users.forEach(u => {
      if (u.referredBy) {
        if (!referralsByReferralCode[u.referredBy]) {
          referralsByReferralCode[u.referredBy] = [];
        }
        const uId = u.id || u._id.toString();
        referralsByReferralCode[u.referredBy].push({
          id: uId,
          name: u.name,
          email: u.email,
          funded: !!fundedUserMap[uId]
        });
      }
    });

    const usersWithBalances = users.map(u => {
      const userId = u.id || u._id.toString();
      const wallet = walletMap[userId] || {
        depositBalance: 0,
        winningsBalance: 0,
        lockedBalance: 0,
        pendingWithdrawals: 0
      };

      const userRefCode = u.referralCode || '';
      const referredUsersList = referralsByReferralCode[userRefCode] || [];

      return {
        ...u,
        id: u.id || u._id.toString(),
        referralCode: userRefCode,
        referredBy: u.referredBy || '',
        referredUsersList,
        balances: {
          depositBalance: wallet.depositBalance,
          winningsBalance: wallet.winningsBalance,
          availableBalance: (wallet.depositBalance || 0) + (wallet.winningsBalance || 0),
          lockedBalance: wallet.lockedBalance,
          pendingWithdrawals: wallet.pendingWithdrawals
        },
        personalWallets: personalWalletMap[userId] ? {
          tron: personalWalletMap[userId].tron?.address || '',
          ethereum: personalWalletMap[userId].ethereum?.address || ''
        } : null
      };
    });

    res.json({ success: true, data: usersWithBalances });
  } catch (error) {
    console.error('Error fetching users admin:', error);
    res.status(500).json({ error: 'Database error fetching users' });
  }
});

// 4. GET /api/admin/matches - Query all live and settled match records
router.get('/matches', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const matches = await db.collection('matches').find({}).sort({ startedAt: -1 }).toArray();
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error fetching matches admin:', error);
    res.status(500).json({ error: 'Database error fetching matches' });
  }
});

// 5. GET /api/admin/ledger - Fetch details on platform revenue, fees, and ledger logs
router.get('/ledger', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    
    // Ledger logs are all transactions in the system
    const ledgerLogs = await db.collection('transactions').find({}).sort({ createdAt: -1 }).toArray();

    // Platform revenue is calculated as the sum of rake from matches
    const matches = await db.collection('matches').find({ status: 'completed' }).toArray();
    const platformRevenue = matches.reduce((sum, m) => sum + (m.rake || 0), 0);

    res.json({
      success: true,
      data: {
        platformRevenue,
        totalFees: platformRevenue, // Platform fees are currently modeled as the rake from matches
        logs: ledgerLogs
      }
    });
  } catch (error) {
    console.error('Error fetching ledger admin:', error);
    res.status(500).json({ error: 'Database error fetching ledger' });
  }
});

// 6. POST /api/admin/migrate-db - Execute schema migration to align wallets to deposit/winnings split
router.post('/migrate-db', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const walletsCol = db.collection('wallets');
    const wallets = await walletsCol.find({}).toArray();
    
    let walletsMigrated = 0;
    for (const wallet of wallets) {
      const updateFields = {};
      
      if (wallet.depositBalance === undefined) {
        updateFields.depositBalance = wallet.availableBalance !== undefined ? wallet.availableBalance : 0;
      }
      
      if (wallet.winningsBalance === undefined) {
        updateFields.winningsBalance = 0;
      }
      
      if (Object.keys(updateFields).length > 0) {
        await walletsCol.updateOne({ _id: wallet._id }, { $set: updateFields });
        walletsMigrated++;
      }
    }
    
    res.json({
      success: true,
      message: `Wallets migration completed. Migrated ${walletsMigrated} wallets.`
    });
  } catch (error) {
    console.error('Error during DB migration route:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// 9. GET /api/admin/settings/flutterwave - Get Flutterwave keys from DB settings
router.get('/settings/flutterwave', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.collection('settings').findOne({ key: 'flutterwave_keys' });
    res.json({
      success: true,
      data: settings?.value || { secretKey: '', publicKey: '', encryptionKey: '' }
    });
  } catch (error) {
    console.error('Error fetching Flutterwave settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 10. POST /api/admin/settings/flutterwave - Update Flutterwave keys in DB settings
router.post('/settings/flutterwave', adminAuth, async (req, res) => {
  const { secretKey, publicKey, encryptionKey } = req.body;
  try {
    const db = await getDb();
    await db.collection('settings').updateOne(
      { key: 'flutterwave_keys' },
      { $set: { value: { secretKey, publicKey, encryptionKey }, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Flutterwave keys updated successfully.' });
  } catch (error) {
    console.error('Error updating Flutterwave settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 11. GET /api/admin/settings/kyc - Get KYC config from DB settings
router.get('/settings/kyc', adminAuth, async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.collection('settings').findOne({ key: 'kyc_config' });
    res.json({
      success: true,
      data: settings?.value || { kycRequired: true }
    });
  } catch (error) {
    console.error('Error fetching KYC settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 12. POST /api/admin/settings/kyc - Update KYC config in DB settings
router.post('/settings/kyc', adminAuth, async (req, res) => {
  const { kycRequired } = req.body;
  try {
    const db = await getDb();
    await db.collection('settings').updateOne(
      { key: 'kyc_config' },
      { $set: { value: { kycRequired: !!kycRequired }, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'KYC settings updated successfully.' });
  } catch (error) {
    console.error('Error updating KYC settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 13. GET /api/admin/settings/platform - Get platform settings from DB (public)
router.get('/settings/platform', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.collection('settings').findOne({ key: 'platform_settings' });
    res.json({
      success: true,
      data: settings?.value || { chatEnabled: true, gameVisibility: {} }
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// 14. POST /api/admin/settings/platform - Update platform settings in DB (admin only)
router.post('/settings/platform', adminAuth, async (req, res) => {
  const { chatEnabled, gameVisibility } = req.body;
  try {
    const db = await getDb();
    await db.collection('settings').updateOne(
      { key: 'platform_settings' },
      { $set: { value: { chatEnabled, gameVisibility }, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Platform settings updated successfully.' });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

