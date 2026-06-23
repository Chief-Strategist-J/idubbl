import { test } from 'node:test';
import assert from 'node:assert';
import fetch from 'node-fetch';

const BASE_URL = 'https://idubbl-backend.onrender.com';
const ADMIN_EMAIL = 'dev.jaydeep919@gmail.com';
const ADMIN_PASSWORD = 'Scaibu@123';

test('Live Admin API System Integration Tests', async (t) => {
  let cookieHeader = '';

  await t.test('1. Authenticate admin user on live Render instance', async () => {
    try {
      const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });

      assert.strictEqual(loginRes.status, 200, `Login should return 200, got: ${loginRes.status}`);
      const loginData = await loginRes.json();
      assert.ok(loginData.user, 'Response should contain user details');
      assert.strictEqual(loginData.user.email, ADMIN_EMAIL, 'User email should match admin account');

      // Capture Better Auth session cookies
      const rawCookies = loginRes.headers.raw && loginRes.headers.raw()['set-cookie'];
      const setCookies = rawCookies || loginRes.headers.get('set-cookie')?.split(',') || [];
      if (setCookies.length > 0) {
        cookieHeader = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
      }
      assert.ok(cookieHeader, 'Session cookie must be returned on successful login');
      console.log('✅ Admin authenticated successfully.');
    } catch (err) {
      assert.fail(`Authentication failed: ${err.message}`);
    }
  });

  await t.test('2. Retrieve user lists via GET /api/admin/users', async () => {
    if (!cookieHeader) assert.fail('Skipping: Cookie header not captured');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'Cookie': cookieHeader }
      });
      assert.strictEqual(res.status, 200, `GET users should return 200, got: ${res.status}`);
      const json = await res.json();
      assert.ok(json.success, 'Response success should be true');
      assert.ok(Array.isArray(json.data), 'data should be an array of users');
      console.log(`✅ GET users succeeded. Found ${json.data.length} users.`);
    } catch (err) {
      assert.fail(`GET users failed: ${err.message}`);
    }
  });

  await t.test('3. Retrieve deposit requests via GET /api/admin/deposits', async () => {
    if (!cookieHeader) assert.fail('Skipping: Cookie header not captured');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/deposits`, {
        headers: { 'Cookie': cookieHeader }
      });
      assert.strictEqual(res.status, 200, `GET deposits should return 200, got: ${res.status}`);
      const json = await res.json();
      assert.ok(json.success, 'Response success should be true');
      assert.ok(Array.isArray(json.data), 'data should be an array of deposits');
      console.log(`✅ GET deposits succeeded. Found ${json.data.length} records.`);
    } catch (err) {
      assert.fail(`GET deposits failed: ${err.message}`);
    }
  });

  await t.test('4. Retrieve withdrawal requests via GET /api/admin/withdrawals', async () => {
    if (!cookieHeader) assert.fail('Skipping: Cookie header not captured');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/withdrawals`, {
        headers: { 'Cookie': cookieHeader }
      });
      assert.strictEqual(res.status, 200, `GET withdrawals should return 200, got: ${res.status}`);
      const json = await res.json();
      assert.ok(json.success, 'Response success should be true');
      assert.ok(Array.isArray(json.data), 'data should be an array of withdrawals');
      console.log(`✅ GET withdrawals succeeded. Found ${json.data.length} records.`);
    } catch (err) {
      assert.fail(`GET withdrawals failed: ${err.message}`);
    }
  });

  await t.test('5. Retrieve matches index via GET /api/admin/matches', async () => {
    if (!cookieHeader) assert.fail('Skipping: Cookie header not captured');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/matches`, {
        headers: { 'Cookie': cookieHeader }
      });
      assert.strictEqual(res.status, 200, `GET matches should return 200, got: ${res.status}`);
      const json = await res.json();
      assert.ok(json.success, 'Response success should be true');
      assert.ok(Array.isArray(json.data), 'data should be an array of matches');
      console.log(`✅ GET matches succeeded. Found ${json.data.length} matches.`);
    } catch (err) {
      assert.fail(`GET matches failed: ${err.message}`);
    }
  });

  await t.test('6. Retrieve ledger & platform revenue via GET /api/admin/ledger', async () => {
    if (!cookieHeader) assert.fail('Skipping: Cookie header not captured');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/ledger`, {
        headers: { 'Cookie': cookieHeader }
      });
      assert.strictEqual(res.status, 200, `GET ledger should return 200, got: ${res.status}`);
      const json = await res.json();
      assert.ok(json.success, 'Response success should be true');
      assert.ok(json.data, 'data should exist');
      assert.ok(json.data.hasOwnProperty('platformRevenue'), 'data must contain platformRevenue');
      assert.ok(Array.isArray(json.data.logs), 'data logs must be an array');
      console.log(`✅ GET ledger succeeded. Revenue: ${json.data.platformRevenue} USDT.`);
    } catch (err) {
      assert.fail(`GET ledger failed: ${err.message}`);
    }
  });
});
