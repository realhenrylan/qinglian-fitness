const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

function loadCorsMiddleware(extraOrigins = '') {
  const appPath = path.resolve(__dirname, '..', 'app.js');
  const originalLoad = Module._load;
  const previousOrigins = process.env.CORS_ALLOWED_ORIGINS;
  const middleware = [];
  const app = { use(fn) { middleware.push(fn); }, post() {}, get() {}, put() {} };
  const express = () => app;
  express.json = () => () => {};
  delete require.cache[appPath];
  process.env.CORS_ALLOWED_ORIGINS = extraOrigins;
  Module._load = function(request, parent, isMain) {
    if (parent && parent.filename === appPath && request === 'express') return express;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    require(appPath);
  } finally {
    Module._load = originalLoad;
    if (previousOrigins === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = previousOrigins;
  }
  return middleware[1];
}

function makeResponse() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    setHeader(name, value) { headers[name] = value; },
    sendStatus(code) { this.statusCode = code; return this; }
  };
}

test('CORS allows same-origin requests and blocks unrelated origins', () => {
  const middleware = loadCorsMiddleware();
  const sameOrigin = makeResponse();
  let sameOriginContinued = false;
  middleware({
    method: 'GET',
    protocol: 'http',
    headers: { host: 'fitness.example', origin: 'https://fitness.example', 'x-forwarded-proto': 'https' }
  }, sameOrigin, () => { sameOriginContinued = true; });

  assert.equal(sameOrigin.headers['Access-Control-Allow-Origin'], 'https://fitness.example');
  assert.equal(sameOrigin.headers['Cache-Control'], 'private, no-store');
  assert.equal(sameOrigin.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(sameOrigin.headers['X-Frame-Options'], 'DENY');
  assert.equal(sameOrigin.headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(sameOriginContinued, true);

  const attacker = makeResponse();
  let attackerContinued = false;
  middleware({
    method: 'OPTIONS',
    protocol: 'https',
    headers: { host: 'fitness.example', origin: 'https://attacker.example', 'x-forwarded-proto': 'https' }
  }, attacker, () => { attackerContinued = true; });

  assert.equal(attacker.statusCode, 403);
  assert.equal(attacker.headers['Access-Control-Allow-Origin'], undefined);
  assert.equal(attackerContinued, false);
});

test('CORS supports explicitly configured extra origins without wildcard access', () => {
  const middleware = loadCorsMiddleware('https://preview.example');
  const response = makeResponse();
  middleware({
    method: 'OPTIONS',
    protocol: 'https',
    headers: { host: 'fitness.example', origin: 'https://preview.example', 'x-forwarded-proto': 'https' }
  }, response, () => {});

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://preview.example');
  assert.notEqual(response.headers['Access-Control-Allow-Origin'], '*');
});
