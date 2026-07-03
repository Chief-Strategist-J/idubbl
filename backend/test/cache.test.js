import test from 'node:test';
import assert from 'node:assert';
import { cacheMiddleware, flushAllCaches, getL1Cache } from '../services/cacheService.js';

test('Cache middleware - L1, L2, L3 multi-tier and invalidation', async () => {
  // Ensure caches are clean
  await flushAllCaches();

  const middleware = cacheMiddleware();

  // Mock GET request
  const req = {
    method: 'GET',
    originalUrl: '/api/test-cache-route',
    url: '/api/test-cache-route',
  };

  let sendCalled = 0;
  let sentBody = null;
  let headers = {};

  const res = {
    statusCode: 200,
    setHeader(name, value) {
      headers[name] = value;
    },
    getHeader(name) {
      return headers[name];
    },
    send(body) {
      sendCalled++;
      if (body !== undefined && body !== null) {
        if (Buffer.isBuffer(body)) {
          sentBody = body.toString('utf8');
        } else if (typeof body === 'object') {
          sentBody = JSON.stringify(body);
        } else {
          sentBody = String(body);
        }
      } else {
        sentBody = body;
      }
      return this;
    },
  };

  let nextCalled = 0;
  const next = () => {
    nextCalled++;
    // Simulate route handler setting response and calling send
    res.send({ status: 'ok', data: 42 });
  };

  // --- First Request: Cache Miss ---
  await middleware(req, res, next);

  assert.strictEqual(nextCalled, 1);
  assert.strictEqual(sendCalled, 1);
  assert.deepEqual(JSON.parse(sentBody), { status: 'ok', data: 42 });

  // L1 cache should now have the entry
  const l1 = getL1Cache();
  assert.ok(l1.has('/api/test-cache-route'));

  // --- Second Request: L1 Cache Hit ---
  sendCalled = 0;
  sentBody = null;
  nextCalled = 0;
  headers = {};

  await middleware(req, res, next);
  assert.strictEqual(nextCalled, 0); // Should serve from cache
  assert.strictEqual(sendCalled, 1);
  assert.strictEqual(headers['X-Cache-Tier'], 'L1');
  assert.deepEqual(JSON.parse(sentBody), { status: 'ok', data: 42 });

  // --- Evict L1 to check L2 (Redis) / L3 (MongoDB) ---
  l1.clear();

  // Give a small delay for async db saves to complete if necessary
  await new Promise(resolve => setTimeout(resolve, 500));

  // --- Third Request: L2/L3 Cache Hit ---
  sendCalled = 0;
  sentBody = null;
  nextCalled = 0;
  headers = {};

  await middleware(req, res, next);
  assert.strictEqual(nextCalled, 0); // Should serve from cache
  assert.strictEqual(sendCalled, 1);
  // It could be L2 or L3 depending on whether Redis is available
  assert.ok(headers['X-Cache-Tier'] === 'L2' || headers['X-Cache-Tier'] === 'L3');
  assert.deepEqual(JSON.parse(sentBody), { status: 'ok', data: 42 });

  // --- POST request should invalidate all caches ---
  const postReq = {
    method: 'POST',
    originalUrl: '/api/test-cache-route',
    url: '/api/test-cache-route',
  };

  const postRes = {
    statusCode: 200,
    setHeader() {},
    getHeader() {},
    send(body) {
      return this;
    },
  };

  let postNextCalled = 0;
  await middleware(postReq, postRes, () => { postNextCalled++; });

  assert.strictEqual(postNextCalled, 1);
  
  // All caches should be flushed now, so L1 should be empty
  assert.strictEqual(l1.size, 0);

  // Give a small delay for async db flush to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  // --- Fourth Request: Cache Miss again after flush ---
  sendCalled = 0;
  sentBody = null;
  nextCalled = 0;
  headers = {};

  await middleware(req, res, next);
  assert.strictEqual(nextCalled, 1);
  assert.strictEqual(sendCalled, 1);
  assert.strictEqual(headers['X-Cache-Tier'], undefined); // Fresh response
});
