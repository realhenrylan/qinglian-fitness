const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const attack = '"><img src=x onerror=alert(1)>';

function createAppRuntime() {
  const stored = new Map([['ql_auth', JSON.stringify({ token: '', username: '', apiBase: '' })]]);
  const element = () => ({ style: {}, value: '', _bound: true, addEventListener() {} });
  const appElement = element();
  const elements = new Map([
    ['#loginGate', element()],
    ['#app', appElement],
    ['#tabbar', element()]
  ]);
  const context = {
    console: { error() {}, log() {} },
    document: {
      documentElement: { dataset: {} },
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, element());
        return elements.get(selector);
      },
      querySelectorAll() { return []; }
    },
    fetch: async () => { throw new Error('unexpected fetch'); },
    localStorage: {
      getItem(key) { return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { stored.set(key, value); }
    },
    location: { hostname: 'fitness.example' },
    window: {},
    attack
  };
  vm.createContext(context);
  vm.runInContext(appSource, context, { filename: 'website/app.js' });
  vm.runInContext('toast = () => {};', context);
  return { context, appElement };
}

function assertPayloadIsEncoded(html) {
  assert.equal(html.includes(attack), false);
  assert.ok(html.includes('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'));
}

test('synced profile values are rendered as text, not HTML', () => {
  const { context, appElement } = createAppRuntime();
  context.attack = attack;

  vm.runInContext('syncApply({ profile: { age: attack, height: attack, weight: attack, targetWeight: attack } }); renderMine();', context);

  assertPayloadIsEncoded(appElement.innerHTML);
});

test('synced workout fields and identifiers are escaped in the statistics view', () => {
  const { context, appElement } = createAppRuntime();
  context.attack = attack;

  vm.runInContext(`syncApply({ records: [{ date: attack, planTitle: attack, minutes: attack, doneCount: attack, total: attack, kcal: attack, id: attack }] }); renderStats();`, context);

  assertPayloadIsEncoded(appElement.innerHTML);
});

test('synced diet fields and water totals are escaped in the diet view', () => {
  const { context, appElement } = createAppRuntime();
  context.attack = attack;

  vm.runInContext(`syncApply({ dietEntries: [{ date: todayStr(), meal: '午餐', foodName: attack, servings: attack, kcal: 1, protein: 1, carb: 1, fat: 1, id: attack }], waterMap: { [todayStr()]: attack } }); renderDiet();`, context);

  assertPayloadIsEncoded(appElement.innerHTML);
});
