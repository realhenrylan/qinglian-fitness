const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

function createExpressMock() {
  const routes = new Map();
  const app = {
    use() {},
    post(route, handler) { routes.set(`POST ${route}`, handler); },
    get(route, handler) { routes.set(`GET ${route}`, handler); },
    put(route, handler) { routes.set(`PUT ${route}`, handler); }
  };
  const express = () => app;
  express.json = () => () => {};
  return { app, routes, express };
}

function createMemoryFileSystem() {
  const files = new Map();
  return {
    files,
    mkdirSync() {},
    readFileSync(file) {
      if (!files.has(file)) throw new Error('file not found');
      return files.get(file);
    },
    renameSync(from, to) {
      files.set(to, files.get(from));
      files.delete(from);
    },
    writeFileSync(file, content) { files.set(file, content); }
  };
}

function loadBackendWithMemoryStorage() {
  const appPath = path.resolve(__dirname, '..', 'app.js');
  const { routes, express } = createExpressMock();
  const memoryFs = createMemoryFileSystem();
  const originalLoad = Module._load;
  const oldDatabaseUrl = process.env.DATABASE_URL;
  delete require.cache[appPath];
  delete process.env.DATABASE_URL;
  Module._load = function(request, parent, isMain) {
    if (parent && parent.filename === appPath && request === 'express') return express;
    if (parent && parent.filename === appPath && request === 'fs') return memoryFs;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    require(appPath);
  } finally {
    Module._load = originalLoad;
    if (oldDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldDatabaseUrl;
  }
  return { routes, memoryFs, appPath };
}

function makeResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('simultaneous registrations for one username create only one account', async () => {
  const { routes, memoryFs, appPath } = loadBackendWithMemoryStorage();
  const register = routes.get('POST /api/register');
  const createRequest = () => ({ body: { username: 'alice', password: 'correct horse' }, headers: {} });
  const responses = [makeResponse(), makeResponse()];

  await Promise.all(responses.map(res => register(createRequest(), res)));

  const dataDir = path.join(path.dirname(appPath), 'data');
  const users = JSON.parse(memoryFs.files.get(path.join(dataDir, 'users.json')));
  const tokens = JSON.parse(memoryFs.files.get(path.join(dataDir, 'tokens.json')));
  assert.equal(Object.keys(users).length, 1);
  assert.equal(Object.keys(tokens).length, 1);
  assert.equal(responses.filter(res => res.body.ok).length, 1);
  assert.equal(responses.filter(res => res.statusCode === 409).length, 1);
});
