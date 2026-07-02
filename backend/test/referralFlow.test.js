import { test } from 'node:test';
import assert from 'node:assert';
import { getDb } from '../services/db.js';

test('Referral System End-to-End Control Flow Test', async () => {
  const db = await getDb();
  
  const referrerUserId = 'test_referrer_' + Date.now();
  const referredUserId = 'test_referred_' + Date.now();
  const referralCode = 'REF_TEST_' + Math.floor(Math.random() * 100000);

  // 1. Create a Referrer user doc
  await db.collection('user').insertOne({
    id: referrerUserId,
    email: `referrer_${Date.now()}@example.com`,
    name: 'Test Referrer User',
    role: 'player',
    status: 'active',
    referralCode: referralCode,
    createdAt: new Date()
  });

  // 2. Create a Referred user doc linking via referredBy
  await db.collection('user').insertOne({
    id: referredUserId,
    email: `referred_${Date.now()}@example.com`,
    name: 'Test Referred User',
    role: 'player',
    status: 'active',
    referralCode: 'REFERRED_CODE_' + Date.now(),
    referredBy: referralCode,
    createdAt: new Date()
  });

  try {
    // 3. Verify linkage in the database
    const referredDoc = await db.collection('user').findOne({ id: referredUserId });
    assert.strictEqual(referredDoc.referredBy, referralCode, 'Referred user should be linked to referrer code.');

    // 4. Check funded status when no transactions exist
    // Simulating player referrals API fetch
    const fetchReferralStatus = async (refCode) => {
      const referredUsers = await db.collection('user').find({ referredBy: refCode }).toArray();
      const list = [];
      for (const refUser of referredUsers) {
        const hasFunded = await db.collection('transactions').findOne({
          userId: refUser.id,
          type: 'deposit',
          status: 'approved'
        });
        list.push({
          id: refUser.id,
          name: refUser.name,
          funded: !!hasFunded
        });
      }
      return list;
    };

    let referrals = await fetchReferralStatus(referralCode);
    assert.strictEqual(referrals.length, 1);
    assert.strictEqual(referrals[0].id, referredUserId);
    assert.strictEqual(referrals[0].funded, false, 'Should be not funded initially (no deposits).');

    // 5. Add a pending deposit, should still show not funded
    await db.collection('transactions').insertOne({
      userId: referredUserId,
      amount: 10,
      type: 'deposit',
      status: 'pending',
      createdAt: new Date()
    });

    referrals = await fetchReferralStatus(referralCode);
    assert.strictEqual(referrals[0].funded, false, 'Pending deposit should not count as funded.');

    // 6. Approve the deposit, should now show funded
    await db.collection('transactions').updateOne(
      { userId: referredUserId, type: 'deposit', status: 'pending' },
      { $set: { status: 'approved' } }
    );

    referrals = await fetchReferralStatus(referralCode);
    assert.strictEqual(referrals[0].funded, true, 'Approved deposit must show as funded.');

    // 7. Verify admin users statistics compilation
    // Simulating GET /api/admin/users aggregate logic
    const allUsers = await db.collection('user').find({}).toArray();
    const approvedDeposits = await db.collection('transactions').find({ type: 'deposit', status: 'approved' }).toArray();
    
    const fundedUserMap = {};
    approvedDeposits.forEach(tx => {
      fundedUserMap[tx.userId] = true;
    });

    const referralsByReferralCode = {};
    allUsers.forEach(u => {
      if (u.referredBy) {
        if (!referralsByReferralCode[u.referredBy]) {
          referralsByReferralCode[u.referredBy] = [];
        }
        referralsByReferralCode[u.referredBy].push({
          id: u.id,
          funded: !!fundedUserMap[u.id]
        });
      }
    });

    const referrerAdminData = allUsers.find(u => u.id === referrerUserId);
    const code = referrerAdminData.referralCode;
    const referredList = referralsByReferralCode[code] || [];
    
    assert.strictEqual(referredList.length, 1, 'Admin stats should show 1 referred user.');
    assert.strictEqual(referredList[0].funded, true, 'Admin stats should show referred user as funded.');

  } finally {
    // Clean up
    await db.collection('user').deleteMany({ id: { $in: [referrerUserId, referredUserId] } });
    await db.collection('transactions').deleteMany({ userId: referredUserId });
  }
});
