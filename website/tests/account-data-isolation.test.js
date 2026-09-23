const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function createAppRuntime(fetchImpl = async () => { throw new Error('unexpected fetch'); }) {
  const stored = new Map([
    ['ql_auth', JSON.stringify({ token: '', username: 'alice', apiBase: '' })],
    ['ql_profile', JSON.stringify({ nickname: 'Alice', weight: 61, height: 168 })],
    ['ql_records', JSON.stringify([{ date: '2026-09-20', exercise: '跑步' }])],
    ['ql_dietEntries', JSON.stringify([{ date: '2026-09-20', food: '午餐' }])],
    ['ql_waterMap', JSON.stringify({ '2026-09-20': 1800 })],
    ['ql_theme', JSON.stringify('dark')]
  ]);
  const element = () => ({ style: {}, value: '', _bound: true });
  const elements = new Map([
    ['#loginGate', element()],
    ['#app', element()],
    ['#tabbar', element()],
    ['#gateUser', element()],
    ['#gatePass', element()]
  ]);
  const context = {
    console: { error() {}, log() {} },
    document: {
      documentElement: { dataset: {} },
      querySelector(selector) { return elements.get(selector) || null; },
      querySelectorAll() { return []; }
    },
    fetch: fetchImpl,
    localStorage: {
      getItem(key) { return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { stored.set(key, value); },
      removeItem(key) { stored.delete(key); }
    },
    location: { hostname: 'fitness.example' },
    window: {}
  };

  vm.createContext(context);
  vm.runInContext(appSource, context, { filename: 'website/app.js' });
  vm.runInContext('toast = () => {}; renderMine = () => {};', context);
  return { context, stored };
}

function storedValue(stored, key) {
  return JSON.parse(stored.get(`ql_${key}`));
}

function assertAccountDataIsCleared(stored) {
  const profile = storedValue(stored, 'profile');
  assert.equal(profile.nickname, '健身新人');
  assert.equal(profile.weight, 70);
  assert.deepEqual(storedValue(stored, 'records'), []);
  assert.deepEqual(storedValue(stored, 'dietEntries'), []);
  assert.deepEqual(storedValue(stored, 'waterMap'), {});
  assert.equal(storedValue(stored, 'theme'), 'dark');
}

test('logging out clears account data but preserves the device theme preference', () => {
  const { context, stored } = createAppRuntime();

  vm.runInContext('doLogout()', context);

  assertAccountDataIsCleared(stored);
  assert.deepEqual(storedValue(stored, 'auth'), { token: '', username: '', apiBase: '' });
});

test('an expired API token clears account data before showing the login gate', async () => {
  const { context, stored } = createAppRuntime(async () => ({ status: 401, json: async () => ({}) }));
  vm.runInContext("auth = { token: 'expired', username: 'alice', apiBase: '' }", context);

  await vm.runInContext("api('GET', '/api/data')", context);

  assertAccountDataIsCleared(stored);
  assert.deepEqual(storedValue(stored, 'auth'), { token: '', username: '', apiBase: '' });
});

test('a cloud download response from the previous session cannot restore data after logout', async () => {
  let resolveResponse;
  let signalRequestStarted;
  const requestStarted = new Promise(resolve => { signalRequestStarted = resolve; });
  const responsePromise = new Promise(resolve => { resolveResponse = resolve; });
  const { context, stored } = createAppRuntime(() => {
    signalRequestStarted();
    return responsePromise;
  });
  vm.runInContext("auth = { token: 'old-session', username: 'alice', apiBase: '' }", context);

  const pendingDownload = vm.runInContext('cloudDownload()', context);
  await requestStarted;
  vm.runInContext('doLogout()', context);
  resolveResponse({
    status: 200,
    json: async () => ({
      ok: true,
      data: {
        profile: { nickname: 'Alice' },
        records: [{ date: '2026-09-20', exercise: '旧账号训练' }],
        dietEntries: [{ date: '2026-09-20', food: '旧账号饮食' }],
        waterMap: { '2026-09-20': 1800 }
      }
    })
  });
  await pendingDownload;

  assertAccountDataIsCleared(stored);
});
