// 轻练健身后端 Express 应用（本地 / Netlify 双模式共用）
// 存储层双模式：设置 DATABASE_URL 时用 PostgreSQL（Neon 免费库，数据持久），
// 否则回退到本地 JSON 文件模式（开发用）
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USE_PG = !!process.env.DATABASE_URL;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PASSWORD_LENGTH = 128;
let pool = null;
if (USE_PG) {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
}

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const USER_DATA_DIR = path.join(DATA_DIR, 'userdata');

const app = express();
app.use(express.json({ limit: '2mb' }));
// Same-origin is the default; cross-origin clients must be explicitly allowlisted.
const corsAllowedOrigins = new Set((process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',').map(origin => origin.trim()).filter(Boolean));
function isAllowedOrigin(origin, req) {
  if (corsAllowedOrigins.has(origin)) return true;
  const host = req.headers.host || '';
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  return Boolean(host) && origin === `${protocol}://${host}`;
}
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const origin = req.headers.origin;
  const allowedOrigin = origin && isAllowedOrigin(origin, req);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigin) return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
});

// ---------- 存储层 ----------
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
async function initDB() {
  if (!USE_PG) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users(
    username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at BIGINT NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS tokens(
    token TEXT PRIMARY KEY, username TEXT NOT NULL, created_at BIGINT NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS userdata(
    username TEXT PRIMARY KEY, data JSONB NOT NULL, synced_at BIGINT NOT NULL)`);
}

const dbUsers = {
  async get(username) {
    if (!USE_PG) return readJSON(USERS_FILE, {})[username] || null;
    const r = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    return r.rows[0] ? { salt: r.rows[0].salt, hash: r.rows[0].hash } : null;
  },
  async set(username, salt, hash) {
    if (!USE_PG) {
      const users = readJSON(USERS_FILE, {});
      if (Object.prototype.hasOwnProperty.call(users, username)) return false;
      users[username] = { salt, hash, createdAt: Date.now() };
      writeJSON(USERS_FILE, users);
      return true;
    }
    const result = await pool.query(
      `INSERT INTO users(username,salt,hash,created_at) VALUES($1,$2,$3,$4)
       ON CONFLICT (username) DO NOTHING RETURNING username`,
      [username, salt, hash, Date.now()]);
    return result.rowCount === 1;
  }
};
const dbTokens = {
  async set(token, username) {
    if (!USE_PG) {
      const tokens = readJSON(TOKENS_FILE, {});
      tokens[token] = { username, createdAt: Date.now() };
      writeJSON(TOKENS_FILE, tokens);
      return;
    }
    await pool.query(
      `INSERT INTO tokens(token,username,created_at) VALUES($1,$2,$3)
       ON CONFLICT (token) DO NOTHING`,
      [token, username, Date.now()]);
  },
  async delete(token) {
    if (!USE_PG) {
      const tokens = readJSON(TOKENS_FILE, {});
      if (Object.prototype.hasOwnProperty.call(tokens, token)) {
        delete tokens[token];
        writeJSON(TOKENS_FILE, tokens);
      }
      return;
    }
    await pool.query('DELETE FROM tokens WHERE token=$1', [token]);
  },
  async deleteExpired() {
    const cutoff = Date.now() - TOKEN_TTL_MS;
    if (!USE_PG) {
      const tokens = readJSON(TOKENS_FILE, {});
      let changed = false;
      for (const [token, session] of Object.entries(tokens)) {
        const createdAt = Number(session && session.createdAt);
        if (!Number.isFinite(createdAt) || createdAt <= cutoff) {
          delete tokens[token];
          changed = true;
        }
      }
      if (changed) writeJSON(TOKENS_FILE, tokens);
      return;
    }
    await pool.query('DELETE FROM tokens WHERE created_at <= $1', [cutoff]);
  },
  async get(token) {
    if (!USE_PG) {
      const tokens = readJSON(TOKENS_FILE, {});
      const session = tokens[token];
      if (!session) return null;
      const createdAt = Number(session.createdAt);
      if (!Number.isFinite(createdAt) || createdAt <= Date.now() - TOKEN_TTL_MS) {
        delete tokens[token];
        writeJSON(TOKENS_FILE, tokens);
        return null;
      }
      return session.username;
    }
    const r = await pool.query('SELECT username, created_at FROM tokens WHERE token=$1', [token]);
    const session = r.rows[0];
    if (!session) return null;
    const createdAt = Number(session.created_at);
    if (!Number.isFinite(createdAt) || createdAt <= Date.now() - TOKEN_TTL_MS) {
      await dbTokens.delete(token);
      return null;
    }
    return session.username;
  }
};
const dbData = {
  async get(username) {
    if (!USE_PG) {
      const file = path.join(USER_DATA_DIR, username + '.json');
      return fs.existsSync(file) ? readJSON(file, {}) : {};
    }
    const r = await pool.query('SELECT data, synced_at FROM userdata WHERE username=$1', [username]);
    if (!r.rows[0]) return {};
    const d = r.rows[0].data || {};
    d.syncedAt = Number(r.rows[0].synced_at) || null;
    return d;
  },
  async set(username, data) {
    const syncedAt = Date.now();
    if (!USE_PG) {
      writeJSON(path.join(USER_DATA_DIR, username + '.json'), Object.assign({}, data, { syncedAt }));
      return syncedAt;
    }
    await pool.query(
      `INSERT INTO userdata(username,data,synced_at) VALUES($1,$2,$3)
       ON CONFLICT (username) DO UPDATE SET data=$2, synced_at=$3`,
      [username, JSON.stringify(data), syncedAt]);
    return syncedAt;
  }
};

// ---------- 认证 ----------
function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 32, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(derivedKey.toString('hex'));
    });
  });
}
async function authUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  return dbTokens.get(token);
}
function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}
async function issueToken(username) {
  await dbTokens.deleteExpired();
  const token = crypto.randomBytes(32).toString('hex');
  await dbTokens.set(token, username);
  return token;
}
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function hasOnlyKeys(value, keys) {
  return Object.keys(value).every(key => keys.has(key));
}
function isString(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}
function isNumber(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function isISODate(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
}
function validateSyncData(data) {
  const topKeys = new Set(['profile', 'records', 'dietEntries', 'waterMap', 'theme', 'v']);
  if (!isPlainObject(data) || !Object.keys(data).length || !hasOnlyKeys(data, topKeys)) return false;
  if (data.v !== undefined && data.v !== 1) return false;
  if (data.profile !== undefined) {
    const profileKeys = new Set(['nickname', 'gender', 'age', 'goal', 'height', 'weight', 'targetWeight']);
    if (!isPlainObject(data.profile) || !hasOnlyKeys(data.profile, profileKeys)) return false;
    if (data.profile.nickname !== undefined && !isString(data.profile.nickname, 40)) return false;
    if (data.profile.gender !== undefined && !isString(data.profile.gender, 20)) return false;
    if (data.profile.goal !== undefined && !isString(data.profile.goal, 24)) return false;
    if (data.profile.age !== undefined && !isNumber(data.profile.age, 0, 150)) return false;
    for (const key of ['height', 'weight', 'targetWeight']) {
      if (data.profile[key] !== undefined && !isNumber(data.profile[key], 0, 1000)) return false;
    }
  }
  if (data.records !== undefined) {
    const recordKeys = new Set(['id', 'planTitle', 'date', 'minutes', 'kcal', 'doneCount', 'total']);
    if (!Array.isArray(data.records) || data.records.length > 5000) return false;
    for (const record of data.records) {
      if (!isPlainObject(record) || !hasOnlyKeys(record, recordKeys)) return false;
      if (record.id !== undefined && !isString(record.id, 128)) return false;
      if (record.planTitle !== undefined && !isString(record.planTitle, 120)) return false;
      if (record.date !== undefined && !isISODate(record.date)) return false;
      for (const key of ['minutes', 'kcal', 'doneCount', 'total']) {
        if (record[key] !== undefined && !isNumber(record[key], 0, 100000)) return false;
      }
    }
  }
  if (data.dietEntries !== undefined) {
    const dietKeys = new Set(['id', 'date', 'meal', 'foodId', 'foodName', 'servings', 'kcal', 'protein', 'carb', 'fat']);
    const meals = new Set(['早餐', '午餐', '晚餐', '加餐']);
    if (!Array.isArray(data.dietEntries) || data.dietEntries.length > 10000) return false;
    for (const entry of data.dietEntries) {
      if (!isPlainObject(entry) || !hasOnlyKeys(entry, dietKeys)) return false;
      if (entry.id !== undefined && !isString(entry.id, 128)) return false;
      if (entry.date !== undefined && !isISODate(entry.date)) return false;
      if (entry.meal !== undefined && (!isString(entry.meal, 16) || !meals.has(entry.meal))) return false;
      if (entry.foodId !== undefined && !isString(entry.foodId, 64)) return false;
      if (entry.foodName !== undefined && !isString(entry.foodName, 120)) return false;
      if (entry.servings !== undefined && !isNumber(entry.servings, 0, 100)) return false;
      for (const key of ['kcal', 'protein', 'carb', 'fat']) {
        if (entry[key] !== undefined && !isNumber(entry[key], 0, 100000)) return false;
      }
    }
  }
  if (data.waterMap !== undefined) {
    if (!isPlainObject(data.waterMap) || Object.keys(data.waterMap).length > 3660) return false;
    for (const [date, cups] of Object.entries(data.waterMap)) {
      if (!isISODate(date) || !Number.isInteger(cups) || cups < 0 || cups > 8) return false;
    }
  }
  if (data.theme !== undefined && !['auto', 'light', 'dark'].includes(data.theme)) return false;
  return true;
}

// ---------- 接口 ----------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.json({ ok: false, msg: '用户名和密码不能为空' });
    if (typeof username !== 'string' || typeof password !== 'string') return res.json({ ok: false, msg: '账号或密码格式错误' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.json({ ok: false, msg: '用户名需为3-20位字母/数字/下划线' });
    if (password.length < 6) return res.json({ ok: false, msg: '密码至少6位' });
    if (password.length > MAX_PASSWORD_LENGTH) return res.json({ ok: false, msg: `密码不能超过${MAX_PASSWORD_LENGTH}位` });
    if (await dbUsers.get(username)) return res.status(409).json({ ok: false, msg: '用户名已存在' });
    const salt = crypto.randomBytes(16).toString('hex');
    const created = await dbUsers.set(username, salt, await hashPassword(password, salt));
    if (!created) return res.status(409).json({ ok: false, msg: '用户名已存在' });
    const token = await issueToken(username);
    res.json({ ok: true, token, username });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || password.length < 6 || password.length > MAX_PASSWORD_LENGTH) {
      return res.json({ ok: false, msg: '用户名或密码错误' });
    }
    const u = await dbUsers.get(username);
    if (!u || u.hash !== await hashPassword(password, u.salt)) {
      return res.json({ ok: false, msg: '用户名或密码错误' });
    }
    const token = await issueToken(username);
    res.json({ ok: true, token, username });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.post('/api/logout', async (req, res) => {
  try {
    const token = bearerToken(req);
    if (token) await dbTokens.delete(token);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: '服务器错误' }); }
});

app.get('/api/data', async (req, res) => {
  try {
    const username = await authUser(req);
    if (!username) return res.status(401).json({ ok: false, msg: '未登录' });
    const data = await dbData.get(username);
    res.json({ ok: true, username, data, syncedAt: data.syncedAt || null });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.put('/api/data', async (req, res) => {
  try {
    const username = await authUser(req);
    if (!username) return res.status(401).json({ ok: false, msg: '未登录' });
    const body = req.body;
    if (!validateSyncData(body)) return res.status(400).json({ ok: false, msg: '数据格式错误' });
    const syncedAt = await dbData.set(username, body);
    res.json({ ok: true, syncedAt });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'qinglian-backend', mode: USE_PG ? 'postgres' : 'file', time: Date.now() }));

module.exports = app;
module.exports.initDB = initDB;
module.exports.USE_PG = USE_PG;
