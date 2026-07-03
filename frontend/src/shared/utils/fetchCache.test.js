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
    global.navigator = { onLine: false };
    
    // Mock event listeners on window
    const listeners = {};
    global.window = {
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      dispatchEvent: vi.fn()
    };

    const { getOfflineQueue, initFetchCache } = await import('./fetchCache.js');
    initFetchCache();

    // Call mutation
    const response = await fetch('/api/create-user', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const resJson = await response.json();
    expect(resJson).toEqual({ success: true, offline: true });

    // Verify it is queued in localStorage
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].url).toBe('/api/create-user');
    expect(queue[0].method).toBe('POST');
    expect(JSON.parse(queue[0].body)).toEqual({ name: 'Alice' });

    // Restored connection and trigger online event
    global.navigator.onLine = true;
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
});

