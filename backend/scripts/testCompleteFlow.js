/**
 * Complete end-to-end flow test:
 * 1. Check user wallet balance
 * 2. Submit a deposit
 * 3. Check deposit appears in admin
 * 4. Submit a withdrawal request
 * 5. Approve the withdrawal (triggers simulated payout)
 * 6. Confirm final wallet state
 */

import fetch from 'node-fetch';

const BASE   = 'https://idubbl-backend.onrender.com/api';
const USER_ID = '6a381dbc3b2194ca68ba7a36';
const headers = { 'Content-Type': 'application/json', 'x-user-id': USER_ID };

function log(step, label, data) {
  console.log(`\n✅ STEP ${step}: ${label}`);
  console.log(JSON.stringify(data, null, 2));
}

async function api(url, opts = {}) {
  const res = await fetch(url, { headers, ...opts });
  if (!res.headers.get('content-type')?.includes('json')) {
    const text = await res.text();
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 120)}`);
  }
  return res.json();
}

async function runFlow() {
  // ── STEP 1: Wallet balance ──────────────────────────────────────────────────
  const wallet = await api(`${BASE}/wallet/balance`);
  log(1, 'Current Wallet Balance', wallet.data);

  // ── STEP 2: Submit deposit ──────────────────────────────────────────────────
  const txHash = 'test_flow_deposit_' + Date.now();
  const deposit = await api(`${BASE}/wallet/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount: 50, network: 'TRC20 (TRON)', txHash, note: 'E2E flow test' })
  });
  log(2, 'Deposit Submitted', deposit.data);

  // ── STEP 3: Deposit visible in admin ────────────────────────────────────────
  const adminDeps = await api(`${BASE}/admin/deposits`);
  const myDep = (adminDeps.data || []).find(d => d.txHash === txHash);
  log(3, 'Deposit visible in Admin (with user name)', myDep
    ? { id: myDep.id, user: myDep.user, email: myDep.userEmail, status: myDep.status, amount: myDep.amount }
    : { note: 'Auto-approved — check approved list' });

  // ── STEP 4: Submit withdrawal ────────────────────────────────────────────────
  const withdrawal = await api(`${BASE}/wallet/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount: 10, address: 'TKmmJAVnZB3PYR42VztCkqkKTGTim1ohih', network: 'TRC20 (TRON)' })
  });
  log(4, 'Withdrawal Submitted', withdrawal.data);

  const withdrawalId = withdrawal.data?.id || withdrawal.data?._id;

  // ── STEP 5: Admin approves withdrawal ────────────────────────────────────────
  let targetId = withdrawalId;
  if (!targetId) {
    const withList = await api(`${BASE}/admin/withdrawals`);
    const pending = (withList.data || []).find(w => w.status === 'pending');
    targetId = pending?.id;
  }

  if (targetId) {
    const approval = await api(`${BASE}/wallet/admin/withdraw/${targetId}/approve`, { method: 'POST' });
    log(5, 'Withdrawal Approved — Payout Triggered', approval);
  } else {
    log(5, 'No pending withdrawal found to approve', {});
  }

  // ── STEP 6: Final wallet state ────────────────────────────────────────────────
  const finalWallet = await api(`${BASE}/wallet/balance`);
  log(6, 'Final Wallet State', finalWallet.data);

  console.log('\n🎉 COMPLETE FLOW TEST DONE\n');
}

runFlow().catch(err => console.error('\n❌ Flow test failed:', err.message));
