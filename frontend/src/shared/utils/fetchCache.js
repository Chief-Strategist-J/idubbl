// L1 in-process memory cache
const l1Cache = new Map();
const L1_TTL_MS = 15 * 60 * 1000; // 15 minutes cache lifecycle
const REVALIDATE_THRESHOLD_MS = 15 * 1000; // 15 seconds revalidation cooldown

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

// Background revalidation logic (Stale-While-Revalidate)
async function revalidateInBackground(url, init, cacheKey, cachedBody, originalFetch) {
  if (activeRequests.has(cacheKey)) return;

  const fetchPromise = (async () => {
    try {
      const res = await originalFetch(url, init);
      if (res.ok) {
        const body = await res.text();
        // Only update cache if the content has changed
        if (body !== cachedBody) {
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
            cachedAt: Date.now(),
          };

          // Update L1
          l1Cache.set(cacheKey, entry);

          // Update L2 (LocalStorage)
          try {
            localStorage.setItem(cacheKey, JSON.stringify(entry));
          } catch (e) {
            // Ignore
          }

          // Trigger custom event to notify components that the API data has updated
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api_cache_updated', { detail: { url, cacheKey } }));
          }
        }
      }
    } catch (e) {
      // Ignore background fetch failures
    }
  })();

  activeRequests.set(cacheKey, fetchPromise);
  try {
    await fetchPromise;
  } finally {
    activeRequests.delete(cacheKey);
  }
}

// Override window.fetch globally
export function initFetchCache() {
  if (typeof window === 'undefined') return;

  // Attach central clear cache method to global window object
  window.clearFrontendCache = clearFrontendCache;

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
      clearFrontendCache();
      return originalFetch.apply(this, arguments);
    }

    // Only cache GET requests
    if (method !== 'GET') {
      return originalFetch.apply(this, arguments);
    }

    const cacheKey = `api_cache:${url}`;

    // 1. Check L1 Memory Cache (Hot Path)
    const l1Entry = l1Cache.get(cacheKey);
    if (l1Entry && Date.now() < l1Entry.expiry) {
      const age = Date.now() - (l1Entry.cachedAt || 0);
      if (age > REVALIDATE_THRESHOLD_MS) {
        // Only trigger background refresh if older than revalidation threshold
        revalidateInBackground(url, init, cacheKey, l1Entry.body, originalFetch);
      }
      
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
          // Populate L1
          l1Cache.set(cacheKey, entry);
          
          const age = Date.now() - (entry.cachedAt || 0);
          if (age > REVALIDATE_THRESHOLD_MS) {
            revalidateInBackground(url, init, cacheKey, entry.body, originalFetch);
          }

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
      // Fallback
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
            cachedAt: Date.now(),
          };

          // Populate L1
          l1Cache.set(cacheKey, entry);

          // Populate L2 (LocalStorage)
          try {
            localStorage.setItem(cacheKey, JSON.stringify(entry));
          } catch (e) {
            // Ignore
          }
        } catch (err) {
          // Ignore
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
