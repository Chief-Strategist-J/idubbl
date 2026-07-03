import Redis from 'ioredis';
import crypto from 'crypto';
import { getDb } from './db.js';

// Bounded LRU Cache for L1 (In-Process)
export class BoundedLRU {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const entry = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// L2 Circuit Breaker
export class RedisCircuitBreaker {
  constructor(cooldownSeconds = 5) {
    this.state = 'CLOSED';
    this.cooldownMs = cooldownSeconds * 1000;
    this.lastStateChange = 0;
  }

  recordSuccess() {
    if (this.state === 'OPEN') {
      this.state = 'CLOSED';
      this.lastStateChange = Date.now();
    }
  }

  recordFailure() {
    if (this.state === 'CLOSED') {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
    }
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastStateChange > this.cooldownMs) {
        return false; // Try half-open
      }
      return true;
    }
    return false;
  }
}

// Instantiations
const l1Cache = new BoundedLRU(1000);
export const redisCircuitBreaker = new RedisCircuitBreaker(5);

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  redisClient.on('error', (err) => {
    redisCircuitBreaker.recordFailure();
  });
} catch (err) {
  redisClient = null;
}

// TTL configuration
const L1_BASE_TTL_SEC = 10;
const L2_BASE_TTL_SEC = 300;
const NEGATIVE_CACHE_TTL_SEC = 5;

// TTL Jitter: Add ±10-20% random jitter
export function getTTLWithJitter(baseSec, minJitterPct = -0.15, maxJitterPct = 0.15) {
  const jitterPct = minJitterPct + Math.random() * (maxJitterPct - minJitterPct);
  return Math.round(baseSec * (1 + jitterPct));
}

// Key Schema Generator: {service}:{api_version}:{resource}:{id}:{variant_hash}
export function generateCacheKey(req) {
  const urlStr = req.originalUrl || req.url || '';
  // Clean query params for path processing
  const pathname = urlStr.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);

  const service = parts[0] || 'default';
  const api_version = (parts[1] && parts[1].startsWith('v')) ? parts[1] : 'v1';
  const resource = parts[2] || parts[1] || 'general';
  const id = parts[3] || 'all';

  const queryStr = urlStr.includes('?') ? urlStr.substring(urlStr.indexOf('?')) : '';
  const variant_hash = crypto.createHash('sha256').update(queryStr).digest('hex').substring(0, 16);

  return `${service}:${api_version}:${resource}:${id}:${variant_hash}`;
}

let isIndexCreated = false;
async function ensureIndex() {
  if (isIndexCreated) return;
  try {
    const db = await getDb();
    await db.collection('api_cache').createIndex({ createdAt: 1 }, { expireAfterSeconds: L2_BASE_TTL_SEC });
    isIndexCreated = true;
  } catch (err) {
    // Ignore
  }
}

export async function flushAllCaches() {
  l1Cache.clear();

  if (redisClient && !redisCircuitBreaker.isOpen()) {
    try {
      await redisClient.flushdb();
      redisCircuitBreaker.recordSuccess();
    } catch (err) {
      redisCircuitBreaker.recordFailure();
    }
  }

  try {
    const db = await getDb();
    await db.collection('api_cache').deleteMany({});
  } catch (err) {
    // Ignore
  }
}

export function getL1Cache() {
  return l1Cache;
}

export function getRedisClient() {
  return redisClient;
}

// Singleflight deduplication map
const pendingResSenders = new Map();

export function cacheMiddleware() {
  return async (req, res, next) => {
    const urlPath = req.originalUrl || req.url || '';
    const cleanPath = urlPath.split('?')[0];

    const isCacheable = cleanPath === '/api/admin/settings/platform' || 
                        cleanPath === '/health' || 
                        cleanPath.startsWith('/api/v1/test/') ||
                        cleanPath.startsWith('/api/v2/test/');

    if (!isCacheable) {
      return next();
    }

    const method = req.method;

    // Write Path / Invalidation: On POST, PUT, DELETE, PATCH, etc.
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const key = generateCacheKey(req);
      
      // Setup write-through interceptor: wait for original write to complete first (update L3 first)
      const originalSend = res.send;
      res.send = function (body) {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        if (isSuccess) {
          // Delete from L1 and L2 on success
          l1Cache.delete(key);
          if (redisClient && !redisCircuitBreaker.isOpen()) {
            redisClient.del(key).catch(() => redisCircuitBreaker.recordFailure());
          }
          // Also remove from MongoDB L3 cache collection
          getDb().then((db) => {
            db.collection('api_cache').deleteOne({ key }).catch(() => {});
          }).catch(() => {});
        }
        return originalSend.apply(this, arguments);
      };

      return next();
    }

    const key = generateCacheKey(req);

    // Trigger index creation in background
    ensureIndex().catch(() => {});

    // 1. READ (Hot Path) - L1 Check
    const l1Entry = l1Cache.get(key);
    if (l1Entry) {
      if (Date.now() < l1Entry.expiry) {
        res.setHeader('X-Cache-Tier', 'L1');
        res.setHeader('Content-Type', l1Entry.contentType || 'application/json');
        return res.send(l1Entry.value);
      } else {
        l1Cache.delete(key);
      }
    }

    // 2. READ (Hot Path) - L2 Check
    let redisValue = null;
    if (redisClient && !redisCircuitBreaker.isOpen()) {
      try {
        redisValue = await redisClient.get(key);
        redisCircuitBreaker.recordSuccess();
      } catch (err) {
        redisCircuitBreaker.recordFailure();
      }
    }

    if (redisValue) {
      try {
        const parsed = JSON.parse(redisValue);
        // Async populate L1
        const l1Ttl = getTTLWithJitter(L1_BASE_TTL_SEC) * 1000;
        l1Cache.set(key, {
          value: parsed.body,
          contentType: parsed.contentType,
          expiry: Date.now() + l1Ttl,
        });

        res.setHeader('X-Cache-Tier', 'L2');
        res.setHeader('Content-Type', parsed.contentType || 'application/json');
        return res.send(parsed.body);
      } catch (err) {
        // Fallback to L3
      }
    }

    // 3. READ (Cold Path) - Singleflight / Dedupe lock on key
    if (pendingResSenders.has(key)) {
      return new Promise((resolve) => {
        pendingResSenders.get(key).push({ res, resolve });
      });
    }

    pendingResSenders.set(key, []);

    // Check L3
    let l3Hit = false;
    let l3Value = null;
    try {
      const db = await getDb();
      const doc = await db.collection('api_cache').findOne({ key });
      if (doc) {
        if (doc.expiry && Date.now() < doc.expiry) {
          l3Hit = true;
          l3Value = JSON.parse(doc.value);
        } else {
          await db.collection('api_cache').deleteOne({ key });
        }
      }
    } catch (err) {
      // Degrade gracefully
    }

    if (l3Hit && l3Value) {
      // Repopulate L2 with TTL (+ jitter)
      const l2Ttl = getTTLWithJitter(L2_BASE_TTL_SEC);
      if (redisClient && !redisCircuitBreaker.isOpen()) {
        try {
          await redisClient.set(key, JSON.stringify(l3Value), 'EX', l2Ttl);
          redisCircuitBreaker.recordSuccess();
        } catch (err) {
          redisCircuitBreaker.recordFailure();
        }
      }

      // Repopulate L1 with shorter TTL
      const l1Ttl = getTTLWithJitter(L1_BASE_TTL_SEC) * 1000;
      l1Cache.set(key, {
        value: l3Value.body,
        contentType: l3Value.contentType,
        expiry: Date.now() + l1Ttl,
      });

      res.setHeader('X-Cache-Tier', 'L3');
      res.setHeader('Content-Type', l3Value.contentType || 'application/json');
      res.send(l3Value.body);

      // Resolve all queued requests
      const waiters = pendingResSenders.get(key) || [];
      pendingResSenders.delete(key);
      for (const waiter of waiters) {
        waiter.res.setHeader('X-Cache-Tier', 'L3');
        waiter.res.setHeader('Content-Type', l3Value.contentType || 'application/json');
        waiter.res.send(l3Value.body);
        waiter.resolve();
      }
      return;
    }

    // Intercept res.send to save response content
    const originalSend = res.send;
    res.send = function (body) {
      const contentType = res.getHeader('Content-Type') || 'application/json';
      let bodyStr = '';
      if (body !== undefined && body !== null) {
        if (Buffer.isBuffer(body)) {
          bodyStr = body.toString('utf8');
        } else if (typeof body === 'object') {
          bodyStr = JSON.stringify(body);
        } else {
          bodyStr = String(body);
        }
      }

      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      const isNotFound = res.statusCode === 404;

      if (isSuccess || isNotFound) {
        const cacheObj = {
          body: bodyStr,
          contentType,
        };
        const cacheStr = JSON.stringify(cacheObj);

        // Determine TTL
        let l1TtlSec = L1_BASE_TTL_SEC;
        let l2TtlSec = L2_BASE_TTL_SEC;
        if (isNotFound) {
          l1TtlSec = NEGATIVE_CACHE_TTL_SEC;
          l2TtlSec = NEGATIVE_CACHE_TTL_SEC;
        }

        const l1Ttl = getTTLWithJitter(l1TtlSec) * 1000;
        const l2Ttl = getTTLWithJitter(l2TtlSec);

        // Save to L1
        l1Cache.set(key, {
          value: bodyStr,
          contentType,
          expiry: Date.now() + l1Ttl,
        });

        // Save to L2 (Redis)
        if (redisClient && !redisCircuitBreaker.isOpen()) {
          redisClient.set(key, cacheStr, 'EX', l2Ttl)
            .then(() => redisCircuitBreaker.recordSuccess())
            .catch(() => redisCircuitBreaker.recordFailure());
        }

        // Save to L3 (MongoDB)
        getDb().then((db) => {
          db.collection('api_cache').updateOne(
            { key },
            {
              $set: {
                key,
                value: cacheStr,
                createdAt: new Date(),
                expiry: Date.now() + l2Ttl * 1000,
              },
            },
            { upsert: true }
          ).catch(() => {});
        }).catch(() => {});

        // Resolve all waiters
        const waiters = pendingResSenders.get(key) || [];
        pendingResSenders.delete(key);
        for (const waiter of waiters) {
          waiter.res.statusCode = res.statusCode;
          waiter.res.setHeader('Content-Type', contentType);
          waiter.res.send(bodyStr);
          waiter.resolve();
        }
      } else {
        // Resolve all waiters (no cache for other error status codes)
        const waiters = pendingResSenders.get(key) || [];
        pendingResSenders.delete(key);
        for (const waiter of waiters) {
          waiter.res.statusCode = res.statusCode;
          waiter.res.setHeader('Content-Type', contentType);
          waiter.res.send(bodyStr);
          waiter.resolve();
        }
      }

      return originalSend.apply(this, arguments);
    };

    next();
  };
}

