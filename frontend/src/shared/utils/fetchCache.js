// L1 in-process memory cache
const l1Cache = new Map();
const L1_TTL_MS = 15 * 60 * 1000; // 15 minutes cache lifecycle
const REVALIDATE_THRESHOLD_MS = 15 * 1000; // 15 seconds revalidation cooldown
const MAX_L1_CACHE_SIZE = 100;

// Singleflight deduplication map for active fetch promises
const activeRequests = new Map();
const activeRevalidations = new Set();

const QUEUE_KEY = 'offline_write_queue';

// Helper to serialize headers into a plain object
function serializeHeaders(headers) {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const obj = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  if (Array.isArray(headers)) {
    const obj = {};
    headers.forEach(([key, value]) => {
      obj[key] = value;
    });
    return obj;
  }
  return headers; // assumed plain object
}

// Get the current offline queue from localStorage
export function getOfflineQueue() {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Save the offline queue to localStorage
function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    // Ignore
  }
}

// Add a mutating request to the offline queue
async function enqueueRequest(url, method, headers, body) {
  const queue = getOfflineQueue();
  
  let serializedBody = body;
  if (body && typeof body !== 'string') {
    if (typeof body.text === 'function') {
      serializedBody = await body.text();
    } else {
      serializedBody = String(body);
    }
  }

  queue.push({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    url,
    method,
    headers: serializeHeaders(headers),
    body: serializedBody,
    timestamp: Date.now()
  });
  saveOfflineQueue(queue);

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('show_toast', {
      detail: {
        message: `Offline: ${method} request queued for synchronization.`,
        type: 'warning',
        duration: 4000
      }
    }));
  }
}

let isReplaying = false;

// Replay the queued mutating requests in FIFO order
export async function replayOfflineQueue() {
  if (isReplaying) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  isReplaying = true;
  
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('show_toast', {
      detail: {
        message: `Restored connection: Synchronizing ${queue.length} pending updates...`,
        type: 'info',
        duration: 3000
      }
    }));
  }

  const originalFetch = window.__originalFetch || (window.fetch && window.fetch.__originalFetch) || window.fetch;

  while (queue.length > 0) {
    const req = queue.shift();
    try {
      const init = {
        method: req.method,
        headers: req.headers,
      };
      if (req.body) {
        init.body = req.body;
      }
      
      const response = await originalFetch(req.url, init);
      if (!response.ok) {
        console.error(`Offline queue replay failed for ${req.url}:`, response.statusText);
      }
    } catch (err) {
      console.error(`Offline queue replay error for ${req.url}:`, err);
      // If we are back offline, preserve the remaining queue and abort replay
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        queue.unshift(req);
        saveOfflineQueue(queue);
        isReplaying = false;
        return;
      }
    }
    saveOfflineQueue(queue);
  }

  isReplaying = false;

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('show_toast', {
      detail: {
        message: 'All offline updates synchronized successfully!',
        type: 'success',
        duration: 4000
      }
    }));
  }
}

// Helper to prune L1 cache and avoid memory leaks
function pruneL1Cache() {
  if (l1Cache.size <= MAX_L1_CACHE_SIZE) return;
  const now = Date.now();
  
  // First, remove expired entries
  for (const [key, val] of l1Cache.entries()) {
    if (now >= val.expiry) {
      l1Cache.delete(key);
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
  }

  // If still over limit, remove the oldest entries (FIFO eviction)
  while (l1Cache.size > MAX_L1_CACHE_SIZE) {
    const oldestKey = l1Cache.keys().next().value;
    if (!oldestKey) break;
    l1Cache.delete(oldestKey);
    try {
      localStorage.removeItem(oldestKey);
    } catch (e) {}
  }
}

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
  if (activeRevalidations.has(cacheKey)) return;
  activeRevalidations.add(cacheKey);

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
        pruneL1Cache();

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
  } finally {
    activeRevalidations.delete(cacheKey);
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
  window.__originalFetch = originalFetch;

  window.fetch = async function (input, init) {
    let method = 'GET';
    if (init && init.method) {
      method = init.method;
    } else if (input && typeof input === 'object' && input.method) {
      method = input.method;
    }
    method = method.toUpperCase();

    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input === 'object') {
      url = input.url || (input instanceof URL ? input.href : String(input));
    } else {
      url = String(input || '');
    }

    // Check if it is a mutation request (POST, PUT, DELETE, PATCH)
    const isMutation = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';

    if (isMutation) {
      clearFrontendCache();
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (isOffline) {
        let headers = (init && init.headers) || (input && input.headers);
        let body = (init && init.body) || (input && input.body);
        await enqueueRequest(url, method, headers, body);
        return new Response(JSON.stringify({ success: true, offline: true }), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' })
        });
      }
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
          pruneL1Cache();
          
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
          pruneL1Cache();

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

  // Add event listener for returning online if supported
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('online', replayOfflineQueue);
  }

  // Attempt to replay on startup if online
  if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
    replayOfflineQueue();
  }
}
