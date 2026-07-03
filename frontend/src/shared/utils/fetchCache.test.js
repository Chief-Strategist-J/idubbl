import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initFetchCache, clearFrontendCache } from './fetchCache.js';

describe('Frontend Fetch Cache', () => {
  let originalFetchSpy;

  beforeEach(() => {
    // Reset global fetch and localStorage
    vi.restoreAllMocks();
    clearFrontendCache();

    // Stub localStorage
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; }),
      key: vi.fn((index) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; }
    };

    // Keep track of the original global fetch
    if (!global.window) {
      global.window = global;
    }
    
    // Reset initialisation flag
    delete window.__fetchCacheInitialized;
  });

  it('should intercept GET request and return cached response on subsequent calls', async () => {
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

    // First call (cache miss)
    const res1 = await fetch('/api/test');
    const data1 = await res1.text();
    expect(JSON.parse(data1)).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call (cache hit L1)
    const res2 = await fetch('/api/test');
    const data2 = await res2.text();
    expect(JSON.parse(data2)).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Still 1 call
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
});
