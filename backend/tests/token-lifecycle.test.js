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
  return { routes, express };
}

function createMemoryFileSystem() {
  const files = new Map();
  return {
    files,
    existsSync(file) { return files.has(file); },
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

function loadBackendWithPostgresStorage(tokenRecords) {
  const appPath = path.resolve(__dirname, '..', 'app.js');
  const { routes, express } = createExpressMock();
  const originalLoad = Module._load;
  const oldDatabaseUrl = process.env.DATABASE_URL;
  const tokens = new Map(Object.entries(tokenRecords));
  class Pool {
    constructor() {}
    async query(sql, params = []) {
      if (sql.startsWith('SELECT username, created_at FROM tokens')) {
        const record = tokens.get(params[0]);
        return { rows: record ? [record] : [], rowCount: record ? 1 : 0 };
      }
      if (sql.startsWith('DELETE FROM tokens WHERE token=$1')) {
        return { rows: [], rowCount: Number(tokens.delete(params[0])) };
      }
      if (sql.startsWith('DELETE FROM tokens WHERE created_at <= $1')) {
        let rowCount = 0;
        for (const [token, record] of tokens) {
          if (Number(record.created_at) <= Number(params[0])) {
            tokens.delete(token);
            rowCount++;
          }
        }
        return { rows: [], rowCount };
      }
      throw new Error(`Unexpected query: ${sql}`);
    }
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
    if (oldDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldDatabaseUrl;
  }
  return { routes, tokens };
}

function tokenStore(memoryFs, appPath) {
  const file = path.join(path.dirname(appPath), 'data', 'tokens.json');
  return {
    file,
    read() { return JSON.parse(memoryFs.files.get(file) || '{}'); },
    write(tokens) { memoryFs.files.set(file, JSON.stringify(tokens)); }
  };
}

async function registerAccount(routes) {
  const response = makeResponse();
  await routes.get('POST /api/register')({
    body: { username: 'alice', password: 'correct horse' },
    headers: {}
  }, response);
  assert.equal(response.body.ok, true);
  return response.body.token;
}

test('logout revokes the current server-side token', async () => {
  const { routes, memoryFs, appPath } = loadBackendWithMemoryStorage();
  const token = await registerAccount(routes);
  const logoutResponse = makeResponse();

  await routes.get('POST /api/logout')({ headers: { authorization: `Bearer ${token}` } }, logoutResponse);

  assert.deepEqual(logoutResponse.body, { ok: true });
  assert.deepEqual(tokenStore(memoryFs, appPath).read(), {});
  const dataResponse = makeResponse();
  await routes.get('GET /api/data')({ headers: { authorization: `Bearer ${token}` } }, dataResponse);
  assert.equal(dataResponse.statusCode, 401);
});

test('expired tokens are rejected and removed when used', async () => {
  const { routes, memoryFs, appPath } = loadBackendWithMemoryStorage();
  const token = await registerAccount(routes);
  const tokens = tokenStore(memoryFs, appPath);
  const records = tokens.read();
  records[token].createdAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
  tokens.write(records);
  const response = makeResponse();

  await routes.get('GET /api/data')({ headers: { authorization: `Bearer ${token}` } }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(tokens.read(), {});
});

test('expired tokens are cleaned up when issuing a new session', async () => {
  const { routes, memoryFs, appPath } = loadBackendWithMemoryStorage();
  const oldToken = await registerAccount(routes);
  const tokens = tokenStore(memoryFs, appPath);
  const records = tokens.read();
  records[oldToken].createdAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
  tokens.write(records);
  const response = makeResponse();

  await routes.get('POST /api/login')({
    body: { username: 'alice', password: 'correct horse' },
    headers: {}
  }, response);

  assert.equal(response.body.ok, true);
  assert.notEqual(response.body.token, oldToken);
  assert.deepEqual(Object.keys(tokens.read()), [response.body.token]);
});

test('PostgreSQL rejects expired tokens and deletes their records', async () => {
  const token = 'expired-token';
  const { routes, tokens } = loadBackendWithPostgresStorage({
    [token]: { username: 'alice', created_at: Date.now() - 8 * 24 * 60 * 60 * 1000 }
  });
  const response = makeResponse();

  await routes.get('GET /api/data')({ headers: { authorization: `Bearer ${token}` } }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(tokens.has(token), false);
});

test('PostgreSQL logout revokes the requested token', async () => {
  const token = 'active-token';
  const { routes, tokens } = loadBackendWithPostgresStorage({
    [token]: { username: 'alice', created_at: Date.now() }
  });
  const response = makeResponse();

  await routes.get('POST /api/logout')({ headers: { authorization: `Bearer ${token}` } }, response);

  assert.deepEqual(response.body, { ok: true });
  assert.equal(tokens.has(token), false);
});
