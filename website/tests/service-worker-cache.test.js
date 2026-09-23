const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const serviceWorkerSource = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function loadServiceWorker({ fetchImpl = async () => ({ status: 200, clone: () => ({}) }), cacheNames = [] } = {}) {
  const listeners = {};
  const deletedCaches = [];
  const cachedRequests = [];
  const self = {
    location: { origin: 'https://fitness.example' },
    clients: { claim: async () => {} },
    addEventListener(name, listener) { listeners[name] = listener; },
    skipWaiting: async () => {}
  };
  const caches = {
    open: async () => ({ put: async request => { cachedRequests.push(request.url); } }),
    match: async () => null,
    keys: async () => cacheNames,
    delete: async name => { deletedCaches.push(name); return true; }
  };

  vm.runInNewContext(serviceWorkerSource, { caches, fetch: fetchImpl, self, URL });
  return { listeners, deletedCaches, cachedRequests };
}

test('same-origin API requests bypass the service worker cache handler', () => {
  let fetchCalls = 0;
  let respondWithCalled = false;
  const { listeners } = loadServiceWorker({ fetchImpl: async () => { fetchCalls++; } });

  listeners.fetch({
    request: { method: 'GET', url: 'https://fitness.example/api/data' },
    respondWith() { respondWithCalled = true; }
  });

  assert.equal(respondWithCalled, false);
  assert.equal(fetchCalls, 0);
});

test('requests carrying a bearer token bypass the service worker cache handler', () => {
  let respondWithCalled = false;
  const { listeners } = loadServiceWorker();

  listeners.fetch({
    request: {
      method: 'GET',
      url: 'https://fitness.example/private/profile',
      headers: { has: name => name === 'Authorization' }
    },
    respondWith() { respondWithCalled = true; }
  });

  assert.equal(respondWithCalled, false);
});

test('activating the new worker removes the old cache that may contain private API responses', async () => {
  const { listeners, deletedCaches } = loadServiceWorker({ cacheNames: ['qinglian-v4'] });
  let activation;

  listeners.activate({ waitUntil(promise) { activation = promise; } });
  await activation;

  assert.deepEqual(deletedCaches, ['qinglian-v4']);
});

test('same-origin static assets remain eligible for offline caching', async () => {
  let responsePromise;
  const { listeners, cachedRequests } = loadServiceWorker();

  listeners.fetch({
    request: { method: 'GET', url: 'https://fitness.example/app.js' },
    respondWith(promise) { responsePromise = promise; }
  });
  await responsePromise;
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(cachedRequests, ['https://fitness.example/app.js']);
});
