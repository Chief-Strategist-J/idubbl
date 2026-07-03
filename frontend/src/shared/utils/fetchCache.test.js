import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initFetchCache, clearFrontendCache } from './fetchCache.js';

describe('Frontend Fetch Cache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearFrontendCache();

    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; }),
      key: vi.fn((index) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; }
    };

    if (!global.window) {
      global.window = global;
    }
    
    delete window.__fetchCacheInitialized;
  });

  it('should intercept GET request, use cache within threshold, and only revalidate when stale', async () => {
    vi.useFakeTimers();
    const mockResponse = { data: 'test-data' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify(mockResponse)
    });

    global.fetch = fetchMock;
    initFetchCache();

    // 1st call (cache miss -> network fetch)
    const res1 = await fetch('/api/test');
    const data1 = await res1.text();
    expect(JSON.parse(data1)).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 2nd call (cache hit -> within 15s threshold -> no network fetch)
    const promise2 = fetch('/api/test');
    vi.advanceTimersByTime(20); // Resolve the 10-15ms timeout
    const res2 = await promise2;
    const data2 = await res2.text();
    expect(JSON.parse(data2)).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1); 

    // Move clock forward by 20 seconds (past 15s threshold)
    vi.advanceTimersByTime(20000);

    // 3rd call (cache hit -> stale -> triggers background revalidation fetch)
    const promise3 = fetch('/api/test');
    vi.advanceTimersByTime(20); // Resolve the 10-15ms timeout
    const res3 = await promise3;
    const data3 = await res3.text();
    expect(JSON.parse(data3)).toEqual(mockResponse);
    
    // Resolve any background promises
    vi.runAllTicks();
    
    // Fired background fetch, total calls should now be 2
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should clear caches when a POST request is made', async () => {
    const mockResponse = { data: 'test-data' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify(mockResponse)
    });

    global.fetch = fetchMock;
    initFetchCache();

    // GET request (populates cache)
    await fetch('/api/test');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // POST request (invalidates cache)
    await fetch('/api/test-create', { method: 'POST', body: '{}' });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Subsequent GET request (should hit network again because cache was cleared)
    await fetch('/api/test');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should deduplicate concurrent GET requests (singleflight)', async () => {
    let resolvePromise;
    const fetchMock = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolvePromise = () => resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: function() { return this; },
        text: async () => JSON.stringify({ data: 'deduped' })
      });
    }));

    global.fetch = fetchMock;
    initFetchCache();

    // Fire concurrent calls
    const promise1 = fetch('/api/parallel');
    const promise2 = fetch('/api/parallel');

    // Resolve the original network request
    resolvePromise();

    const [res1, res2] = await Promise.all([promise1, promise2]);
    const data1 = await res1.text();
    const data2 = await res2.text();

    expect(data1).toEqual(data2);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only 1 network request fired
  });

  it('should support URL objects and custom Request objects', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify({ data: 'ok' })
    });

    global.fetch = fetchMock;
    initFetchCache();

    // Test with URL object
    const urlObj = new URL('http://localhost/api/url-obj');
    await fetch(urlObj);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Test with Request-like object
    const requestLikeObj = { url: '/api/req-obj', method: 'GET' };
    await fetch(requestLikeObj);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should enforce L1 cache size limits to prevent memory leaks', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify({ url })
    }));

    global.fetch = fetchMock;
    initFetchCache();

    // Put 105 entries in the cache (limit is 100)
    for (let i = 0; i < 105; i++) {
      await fetch(`/api/item-${i}`);
    }

    // Clear L2 (localStorage) so it does not mask L1 cache eviction
    global.localStorage.clear();

    // First few entries should have been evicted (e.g. /api/item-0)
    // To verify, calling it again should trigger a new network fetch
    fetchMock.mockClear();
    
    // Call item-0 (which was evicted)
    await fetch('/api/item-0');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Call item-104 (which should still be in cache)
    fetchMock.mockClear();
    const promise = fetch('/api/item-104');
    if (global.vi) {
      global.vi.advanceTimersByTime(20);
    }
    await promise;
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('should intercept POST mutation when offline, queue it, and replay on online event', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify({ success: true })
    });

    global.fetch = fetchMock;
    
    // Simulate offline
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => false,
        configurable: true
      });
    } else {
      globalThis.navigator = { onLine: false };
    }
    
    // Mock event listeners on window
    const listeners = {};
    global.window.addEventListener = vi.fn((event, cb) => {
      listeners[event] = cb;
    });
    global.window.dispatchEvent = vi.fn();

    const { getOfflineQueue, initFetchCache } = await import('./fetchCache.js');
    initFetchCache();

    // Call mutation
    const response = await fetch('/api/create-user', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const resText = await response.text();
    const resJson = JSON.parse(resText);
    expect(resJson).toEqual({ success: true, offline: true });

    // Verify it is queued in localStorage
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].url).toBe('/api/create-user');
    expect(queue[0].method).toBe('POST');
    expect(JSON.parse(queue[0].body)).toEqual({ name: 'Alice' });

    // Restored connection and trigger online event
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => true,
        configurable: true
      });
    } else {
      globalThis.navigator = { onLine: true };
    }
    expect(listeners['online']).toBeDefined();

    // Trigger the online event handler
    await listeners['online']();

    // Verify it replayed the request through the original fetch mock
    expect(fetchMock).toHaveBeenCalledWith('/api/create-user', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' })
    }));

    // Verify queue is now empty
    expect(getOfflineQueue().length).toBe(0);
  });

  it('should replay offline mutation requests in FIFO order when connection is restored', async () => {
    const replayedRequests = [];
    const fetchMock = vi.fn().mockImplementation((url, init) => {
      replayedRequests.push({ url, method: init.method, body: init.body });
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: function() { return this; },
        text: async () => JSON.stringify({ success: true })
      });
    });

    global.fetch = fetchMock;
    
    // Simulate offline
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => false,
        configurable: true
      });
    } else {
      globalThis.navigator = { onLine: false };
    }
    
    // Mock event listeners on window
    const listeners = {};
    global.window.addEventListener = vi.fn((event, cb) => {
      listeners[event] = cb;
    });
    global.window.dispatchEvent = vi.fn();

    const { getOfflineQueue, initFetchCache } = await import('./fetchCache.js');
    initFetchCache();

    // Call first mutation
    await fetch('/api/create-user-1', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Call second mutation
    await fetch('/api/create-user-2', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob' }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Call third mutation
    await fetch('/api/create-user-3', {
      method: 'POST',
      body: JSON.stringify({ name: 'Charlie' }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Verify all three are queued in order
    const queue = getOfflineQueue();
    expect(queue.length).toBe(3);
    expect(queue[0].url).toBe('/api/create-user-1');
    expect(queue[1].url).toBe('/api/create-user-2');
    expect(queue[2].url).toBe('/api/create-user-3');

    // Restored connection and trigger online event
    global.navigator = { onLine: true };
    expect(listeners['online']).toBeDefined();

    // Trigger the online event handler
    await listeners['online']();

    // Verify they are replayed in order (FIFO)
    expect(replayedRequests.length).toBe(3);
    expect(replayedRequests[0].url).toBe('/api/create-user-1');
    expect(replayedRequests[0].body).toBe(JSON.stringify({ name: 'Alice' }));
    expect(replayedRequests[1].url).toBe('/api/create-user-2');
    expect(replayedRequests[1].body).toBe(JSON.stringify({ name: 'Bob' }));
    expect(replayedRequests[2].url).toBe('/api/create-user-3');
    expect(replayedRequests[2].body).toBe(JSON.stringify({ name: 'Charlie' }));

    // Verify queue is now empty
    expect(getOfflineQueue().length).toBe(0);
  });

  it('should bypass caching for auth and KYC GET requests', async () => {
    const mockResponse = { user: { id: 'u1' } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify(mockResponse)
    });

    global.fetch = fetchMock;
    initFetchCache();

    // First call to get-session
    await fetch('/api/auth/get-session');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call to get-session (should hit network again, not cache)
    await fetch('/api/auth/get-session');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should bypass offline queueing for auth and KYC POST requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: function() { return this; },
      text: async () => JSON.stringify({ success: true })
    });

    global.fetch = fetchMock;
    
    // Simulate offline
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => false,
        configurable: true
      });
    } else {
      globalThis.navigator = { onLine: false };
    }

    const { getOfflineQueue, initFetchCache } = await import('./fetchCache.js');
    initFetchCache();

    // Trigger authentication POST call while offline
    try {
      await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com' })
      });
    } catch (e) {
      // Expect normal network/fetch error when offline
    }

    // Verify it was NOT enqueued in localStorage
    const queue = getOfflineQueue();
    expect(queue.length).toBe(0);
  });

  it('should halt replay and preserve remaining queue if a network failure occurs mid-replay', async () => {
    let callIndex = 0;
    const fetchMock = vi.fn().mockImplementation((url) => {
      callIndex++;
      if (callIndex === 2) {
        // Second call throws network error (connection drop)
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: function() { return this; },
        text: async () => JSON.stringify({ success: true })
      });
    });

    global.fetch = fetchMock;
    
    // Simulate offline
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => false,
        configurable: true
      });
    } else {
      globalThis.navigator = { onLine: false };
    }
    
    // Mock event listeners on window
    const listeners = {};
    global.window.addEventListener = vi.fn((event, cb) => {
      listeners[event] = cb;
    });
    global.window.dispatchEvent = vi.fn();

    const { getOfflineQueue, initFetchCache } = await import('./fetchCache.js');
    initFetchCache();

    // Enqueue three requests
    await fetch('/api/req-1', { method: 'POST', body: '{}' });
    await fetch('/api/req-2', { method: 'POST', body: '{}' });
    await fetch('/api/req-3', { method: 'POST', body: '{}' });

    expect(getOfflineQueue().length).toBe(3);

    // Restore online connection
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        get: () => true,
        configurable: true
      });
    }

    // Trigger online event to start replay
    await listeners['online']();

    // Verify queue is not empty: req-2 failed, so req-2 and req-3 must remain in queue!
    const remainingQueue = getOfflineQueue();
    expect(remainingQueue.length).toBe(2);
    expect(remainingQueue[0].url).toBe('/api/req-2');
    expect(remainingQueue[1].url).toBe('/api/req-3');

    // First request was successfully sent, second failed. Fired exactly 2 calls.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should discard in-flight revalidations if the cache is cleared/mutated concurrently', async () => {
    vi.useFakeTimers();
    let resolveRevalidation;
    let fetchCount = 0;
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url === '/api/test-race') {
        fetchCount++;
        if (fetchCount === 2) {
          return new Promise((resolve) => {
            resolveRevalidation = () => resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              headers: new Headers({ 'content-type': 'application/json' }),
              clone: function() { return this; },
              text: async () => JSON.stringify({ data: 'fresh-mutated-leak' })
            });
          });
        }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: function() { return this; },
        text: async () => JSON.stringify({ data: 'stale-data' })
      });
    });

    global.fetch = fetchMock;
    initFetchCache();

    // Populate L1 cache initially
    const res1 = await fetch('/api/test-race');
    await res1.text();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Fast-forward past revalidation threshold
    vi.advanceTimersByTime(20000);

    // Call it again to hit cache and trigger async background revalidation (which stays pending)
    const promise = fetch('/api/test-race');
    vi.advanceTimersByTime(20); // resolve latency timeout
    await promise;

    // Mutate and clear cache concurrently (e.g. POST request)
    await fetch('/api/mutation', { method: 'POST', body: '{}' });

    // Now resolve the background revalidation that started before the mutation
    resolveRevalidation();
    // Advance fake timers to resolve the promise chain
    vi.advanceTimersByTime(10);

    // Verify cache remains empty (no stale leak from the in-flight revalidation)
    fetchMock.mockClear();
    const checkPromise = fetch('/api/test-race');
    vi.advanceTimersByTime(20);
    await checkPromise;
    expect(fetchMock).toHaveBeenCalledTimes(1); // Fired a network fetch (cache miss), proving the stale revalidation was discarded!
    
    vi.useRealTimers();
  });
});

