const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

function createExpressMock() {
  const app = { use() {}, post() {}, get() {}, put() {} };
  const express = () => app;
  express.json = () => () => {};
  return express;
}

function loadBackendWithDatabaseUrl() {
  const appPath = path.resolve(__dirname, '..', 'app.js');
  const originalLoad = Module._load;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  let poolOptions;
  const express = createExpressMock();
  class Pool {
    constructor(options) { poolOptions = options; }
    async query() { return { rows: [], rowCount: 0 }; }
  }
  delete require.cache[appPath];
  process.env.DATABASE_URL = 'postgres://example.invalid/fitness';
  Module._load = function(request, parent, isMain) {
    if (parent && parent.filename === appPath && request === 'express') return express;
    if (parent && parent.filename === appPath && request === 'pg') return { Pool };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    require(appPath);
  } finally {
    Module._load = originalLoad;
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
  return poolOptions;
}

test('PostgreSQL connections verify the server TLS certificate', () => {
  const options = loadBackendWithDatabaseUrl();

  assert.equal(options.ssl.rejectUnauthorized, true);
});
