// L1 in-process memory cache
const l1Cache = new Map();
const L1_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Singleflight deduplication map for active fetch promises
const activeRequests = new Map();

// Helper to clear all cache
export function clearFrontendCache() {
  l1Cache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('api_cache:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Override window.fetch globally
export function initFetchCache() {
  if (typeof window === 'undefined') return;

  // Prevent multiple initializations
  if (window.__fetchCacheInitialized) return;
  window.__fetchCacheInitialized = true;

  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const method = (init && init.method ? init.method : 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

    // Check if it is a mutation request (POST, PUT, DELETE, PATCH)
    const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';

    if (isMutation) {
      // Clear cache immediately
      clearFrontendCache();
      return originalFetch.apply(this, arguments);
    }

    // Only cache GET requests
    if (method !== 'GET') {
      return originalFetch.apply(this, arguments);
    }

    // Cache key schema
    const cacheKey = `api_cache:${url}`;

    // 1. Check L1 Memory Cache
    const l1Entry = l1Cache.get(cacheKey);
    if (l1Entry && Date.now() < l1Entry.expiry) {
      return new Response(l1Entry.body, {
        status: l1Entry.status,
        statusText: l1Entry.statusText,
        headers: new Headers(l1Entry.headers),
      });
    }

    // 2. Check L2 (LocalStorage)
    try {
      const l2Data = localStorage.getItem(cacheKey);
      if (l2Data) {
        const entry = JSON.parse(l2Data);
        if (Date.now() < entry.expiry) {
          // Populate L1 cache
          l1Cache.set(cacheKey, entry);
          return new Response(entry.body, {
            status: entry.status,
            statusText: entry.statusText,
            headers: new Headers(entry.headers),
          });
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      // Fallback gracefully
    }

    // 3. Cold Path: Singleflight / Deduplicate matching requests
    if (activeRequests.has(cacheKey)) {
      const responseCopy = await activeRequests.get(cacheKey);
      return responseCopy.clone();
    }

    const fetchPromise = (async () => {
      const res = await originalFetch.apply(this, arguments);
      if (res.ok) {
        const clonedRes = res.clone();
        try {
          const body = await clonedRes.text();
          const headersObj = {};
          res.headers.forEach((val, key) => {
            headersObj[key] = val;
          });

          const entry = {
            body,
            status: res.status,
            statusText: res.statusText,
            headers: headersObj,
            expiry: Date.now() + L1_TTL_MS,
          };

          // Populate L1
          l1Cache.set(cacheKey, entry);

          // Populate L2 (LocalStorage)
          try {
            localStorage.setItem(cacheKey, JSON.stringify(entry));
          } catch (e) {
            // Ignore full storage errors
          }
        } catch (err) {
          // Stream read error or non-cacheable data
        }
      }
      return res;
    })();

    activeRequests.set(cacheKey, fetchPromise);

    try {
      const response = await fetchPromise;
      return response.clone();
    } finally {
      activeRequests.delete(cacheKey);
    }
  };
}
