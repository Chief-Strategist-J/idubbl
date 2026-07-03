import test from 'node:test';
import assert from 'node:assert';
import { 
  cacheMiddleware, 
  flushAllCaches, 
  getL1Cache, 
  generateCacheKey, 
  getTTLWithJitter,
  BoundedLRU,
  redisCircuitBreaker
} from '../services/cacheService.js';

test('Cache Architecture Validation', async (t) => {

  await t.test('1. Bounded L1 LRU Cache Size', () => {
    const lru = new BoundedLRU(3);
    lru.set('k1', 'v1');
    lru.set('k2', 'v2');
    lru.set('k3', 'v3');
    assert.strictEqual(lru.size, 3);
    
    // k1 should be oldest, let's add k4 and verify k1 is evicted
    lru.set('k4', 'v4');
    assert.strictEqual(lru.size, 3);
    assert.strictEqual(lru.get('k1'), null);
    assert.strictEqual(lru.get('k2'), 'v2');
    assert.strictEqual(lru.get('k3'), 'v3');
    assert.strictEqual(lru.get('k4'), 'v4');

    // Access k2 (moves to MRU), add k5, k3 should be evicted
    lru.get('k2');
    lru.set('k5', 'v5');
    assert.strictEqual(lru.get('k3'), null);
    assert.strictEqual(lru.get('k2'), 'v2');
  });

  await t.test('2. Key Schema Formatting', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/v2/users/12345?name=alex&role=admin',
      url: '/api/v2/users/12345?name=alex&role=admin'
    };
    const key = generateCacheKey(req);
    // Format: {service}:{api_version}:{resource}:{id}:{variant_hash}
    const parts = key.split(':');
    assert.strictEqual(parts.length, 5);
    assert.strictEqual(parts[0], 'api');
    assert.strictEqual(parts[1], 'v2');
    assert.strictEqual(parts[2], 'users');
    assert.strictEqual(parts[3], '12345');
    assert.strictEqual(parts[4].length, 16); // SHA-256 slice length
  });

  await t.test('3. TTL Jitter Generation', () => {
    const base = 100;
    for (let i = 0; i < 20; i++) {
      const jittered = getTTLWithJitter(base);
      assert.ok(jittered >= 80 && jittered <= 120);
    }
  });

  await t.test('4. Redis Circuit Breaker', () => {
    const cb = new redisCircuitBreaker.constructor(2); // 2s cooldown
    assert.strictEqual(cb.isOpen(), false);
    cb.recordFailure();
    assert.strictEqual(cb.isOpen(), true);
    
    cb.recordSuccess();
    assert.strictEqual(cb.isOpen(), false);
  });

  await t.test('5. Cache Flow and Middleware - Multi-tier, Singleflight, Invalidation, and Negative Caching', async () => {
    await flushAllCaches();
    const middleware = cacheMiddleware();

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/test/item1',
      url: '/api/v1/test/item1',
    };
    const key = generateCacheKey(req);

    let nextCount = 0;
    const makeRes = (status = 200) => {
      const headers = {};
      return {
        statusCode: status,
        setHeader(n, v) { headers[n] = v; },
        getHeader(n) { return headers[n]; },
        send(body) {
          this.body = body;
          return this;
        }
      };
    };

    const parseIfString = (val) => typeof val === 'string' ? JSON.parse(val) : val;

    // First request: Cache Miss
    const res1 = makeRes();
    await middleware(req, res1, () => {
      nextCount++;
      res1.send({ value: 'hello' });
    });

    assert.strictEqual(nextCount, 1);
    assert.deepEqual(parseIfString(res1.body), { value: 'hello' });

    // Wait slightly for L3 DB writes to complete async
    await new Promise(r => setTimeout(r, 200));

    // L1 should have it
    const l1 = getL1Cache();
    assert.ok(l1.has(key));

    // Second request: L1 hit
    const res2 = makeRes();
    let nextCount2 = 0;
    await middleware(req, res2, () => { nextCount2++; });
    assert.strictEqual(nextCount2, 0);
    assert.strictEqual(res2.getHeader('X-Cache-Tier'), 'L1');

    // Singleflight test: run two concurrent requests on miss
    const reqSf = {
      method: 'GET',
      originalUrl: '/api/v1/test/sf-item',
      url: '/api/v1/test/sf-item',
    };
    const keySf = generateCacheKey(reqSf);
    l1.delete(keySf); // ensure it's not in L1

    let handlerCalls = 0;
    const p1Res = makeRes();
    const p2Res = makeRes();

    const runRequest = (res) => {
      return middleware(reqSf, res, async () => {
        handlerCalls++;
        // Simulate database delay
        await new Promise(r => setTimeout(r, 100));
        res.send({ value: 'sf-value' });
      });
    };

    await Promise.all([
      runRequest(p1Res),
      runRequest(p2Res)
    ]);

    // Handler should be called exactly once
    assert.strictEqual(handlerCalls, 1);
    assert.deepEqual(parseIfString(p1Res.body), { value: 'sf-value' });
    assert.deepEqual(parseIfString(p2Res.body), { value: 'sf-value' });

    // Negative caching: 404 should be cached
    const req404 = {
      method: 'GET',
      originalUrl: '/api/v1/test/missing',
      url: '/api/v1/test/missing',
    };
    const key404 = generateCacheKey(req404);
    const res404 = makeRes(404);
    let next404 = 0;
    await middleware(req404, res404, () => {
      next404++;
      res404.send({ error: 'not found' });
    });
    assert.strictEqual(next404, 1);
    
    // Check that it's in L1
    assert.ok(l1.has(key404));

    // Write-through Invalidation: POST request on the same route should delete cache
    const postReq = {
      method: 'POST',
      originalUrl: '/api/v1/test/item1',
      url: '/api/v1/test/item1',
    };
    const postRes = makeRes(200);
    let postNext = 0;
    await middleware(postReq, postRes, () => {
      postNext++;
      postRes.send({ success: true });
    });
    assert.strictEqual(postNext, 1);

    // key should be cleared from L1
    assert.strictEqual(l1.has(key), false);
  });
});
