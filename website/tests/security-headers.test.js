const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(repoRoot, 'website', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(repoRoot, 'website', 'app.js'), 'utf8');
const netlify = fs.readFileSync(path.join(repoRoot, 'netlify.toml'), 'utf8');

test('the page uses external scripts compatible with a strict script policy', () => {
  assert.match(html, /<script src="theme-init\.js"><\/script>/);
  assert.match(html, /<script src="register-sw\.js"><\/script>/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\bon[a-z]+\s*=/i);
  assert.doesNotMatch(app, /\bon[a-z]+\s*=/i);
  assert.doesNotMatch(app, /\beval\s*\(|new Function\s*\(/);
});

test('Netlify applies browser security headers and limits authentication routes', () => {
  const csp = netlify.match(/^\s*Content-Security-Policy\s*=\s*"([^"]+)"/m)?.[1];
  assert.ok(csp);
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(netlify, /from = "\/api\/register"[\s\S]*?window_limit = 20[\s\S]*?window_size = 60[\s\S]*?aggregate_by = \["ip", "domain"\]/);
  assert.match(netlify, /from = "\/api\/login"[\s\S]*?window_limit = 20[\s\S]*?window_size = 60[\s\S]*?aggregate_by = \["ip", "domain"\]/);
});
