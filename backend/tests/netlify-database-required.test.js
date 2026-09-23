const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const functionPath = path.resolve(__dirname, '..', 'netlify', 'functions', 'api.js');

test('Netlify API refuses to start without a persistent database URL', () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete require.cache[functionPath];

  try {
    assert.throws(() => require(functionPath), /DATABASE_URL is required for Netlify Functions/);
  } finally {
    delete require.cache[functionPath];
    if (previousDatabaseUrl !== undefined) process.env.DATABASE_URL = previousDatabaseUrl;
  }
});
