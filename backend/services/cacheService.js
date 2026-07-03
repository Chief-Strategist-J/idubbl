import Redis from 'ioredis';
import { getDb } from './db.js';

// Setup L1 cache
const l1Cache = new Map();

// Setup L2 cache (Redis)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  redisClient.on('error', (err) => {
    // Graceful error handling
  });
} catch (err) {
  redisClient = null;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in ms
const CACHE_TTL_SEC = 15 * 60;       // 15 minutes in seconds

let isIndexCreated = false;
async function ensureIndex() {
  if (isIndexCreated) return;
  try {
    const db = await getDb();
    await db.collection('api_cache').createIndex({ createdAt: 1 }, { expireAfterSeconds: CACHE_TTL_SEC });
    isIndexCreated = true;
  } catch (err) {
    // Ignore or handle gracefully
  }
}

export async function flushAllCaches() {
  // Clear L1
  l1Cache.clear();

  // Clear L2 (Redis)
  if (redisClient) {
    try {
      await redisClient.flushdb();
    } catch (err) {
      // Ignore
    }
  }

  // Clear L3 (MongoDB)
  try {
    const db = await getDb();
    await db.collection('api_cache').deleteMany({});
  } catch (err) {
    // Ignore
  }
}

// Return the Map object for test verification if needed
export function getL1Cache() {
  return l1Cache;
}

// Return the Redis client for test verification if needed
export function getRedisClient() {
  return redisClient;
}

export function cacheMiddleware() {
  return async (req, res, next) => {
    const method = req.method;

    // Handle cache invalidation on any POST/mutation request
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      await flushAllCaches();
      return next();
    }

    // Only cache GET requests
    if (method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;

    // Trigger index creation for L3 cache in background
    ensureIndex().catch(() => {});

    // 1. L1 (Memory Cache) check
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

    // 2. L2 (Redis Cache) check
    let redisValue = null;
    if (redisClient) {
      try {
        redisValue = await redisClient.get(key);
      } catch (err) {
        // Fallback gracefully
      }
    }

    if (redisValue) {
      try {
        const parsed = JSON.parse(redisValue);
        // Put back to L1
        l1Cache.set(key, {
          value: parsed.body,
          contentType: parsed.contentType,
          expiry: Date.now() + CACHE_TTL_MS,
        });
        res.setHeader('X-Cache-Tier', 'L2');
        res.setHeader('Content-Type', parsed.contentType || 'application/json');
        return res.send(parsed.body);
      } catch (err) {
        // Fail-safe: fallback to L3
      }
    }

    // 3. L3 (MongoDB Cache) check
    let mongoValue = null;
    try {
      const db = await getDb();
      const doc = await db.collection('api_cache').findOne({ key });
      if (doc) {
        if (doc.expiry && Date.now() < doc.expiry) {
          mongoValue = doc.value;
        } else {
          await db.collection('api_cache').deleteOne({ key });
        }
      }
    } catch (err) {
      // Fallback gracefully
    }

    if (mongoValue) {
      try {
        const parsed = JSON.parse(mongoValue);
        // Put back to L1 and L2
        l1Cache.set(key, {
          value: parsed.body,
          contentType: parsed.contentType,
          expiry: Date.now() + CACHE_TTL_MS,
        });
        if (redisClient) {
          try {
            await redisClient.set(key, mongoValue, 'EX', CACHE_TTL_SEC);
          } catch (err) {
            // Ignore
          }
        }
        res.setHeader('X-Cache-Tier', 'L3');
        res.setHeader('Content-Type', parsed.contentType || 'application/json');
        return res.send(parsed.body);
      } catch (err) {
        // Fail-safe: fallback to original route handler
      }
    }

    // Intercept res.send to save response content
    const originalSend = res.send;
    res.send = function (body) {
      // Only cache successful GET responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
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

        const cacheObj = {
          body: bodyStr,
          contentType,
        };
        const cacheStr = JSON.stringify(cacheObj);

        // Save to L1
        l1Cache.set(key, {
          value: bodyStr,
          contentType,
          expiry: Date.now() + CACHE_TTL_MS,
        });

        // Save to L2 (Redis)
        if (redisClient) {
          redisClient.set(key, cacheStr, 'EX', CACHE_TTL_SEC).catch(() => {});
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
                expiry: Date.now() + CACHE_TTL_MS,
              },
            },
            { upsert: true }
          ).catch(() => {});
        }).catch(() => {});
      }

      return originalSend.apply(this, arguments);
    };

    next();
  };
}
