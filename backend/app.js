// 轻练健身后端 Express 应用（本地 / Netlify 双模式共用）
// 存储层双模式：设置 DATABASE_URL 时用 PostgreSQL（Neon 免费库，数据持久），
// 否则回退到本地 JSON 文件模式（开发用）
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USE_PG = !!process.env.DATABASE_URL;
let pool = null;
if (USE_PG) {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const USER_DATA_DIR = path.join(DATA_DIR, 'userdata');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
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
      users[username] = { salt, hash, createdAt: Date.now() };
      writeJSON(USERS_FILE, users);
      return;
    }
    await pool.query(
      `INSERT INTO users(username,salt,hash,created_at) VALUES($1,$2,$3,$4)
       ON CONFLICT (username) DO UPDATE SET salt=$2, hash=$3`,
      [username, salt, hash, Date.now()]);
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
       ON CONFLICT (token) DO UPDATE SET username=$2`,
      [token, username, Date.now()]);
  },
  async get(token) {
    if (!USE_PG) {
      const tokens = readJSON(TOKENS_FILE, {});
      return tokens[token] ? tokens[token].username : null;
    }
    const r = await pool.query('SELECT username FROM tokens WHERE token=$1', [token]);
    return r.rows[0] ? r.rows[0].username : null;
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
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}
async function authUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  return dbTokens.get(token);
}

// ---------- 接口 ----------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.json({ ok: false, msg: '用户名和密码不能为空' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.json({ ok: false, msg: '用户名需为3-20位字母/数字/下划线' });
    if (String(password).length < 6) return res.json({ ok: false, msg: '密码至少6位' });
    if (await dbUsers.get(username)) return res.json({ ok: false, msg: '用户名已存在' });
    const salt = crypto.randomBytes(16).toString('hex');
    await dbUsers.set(username, salt, hashPassword(password, salt));
    const token = crypto.randomBytes(32).toString('hex');
    await dbTokens.set(token, username);
    res.json({ ok: true, token, username });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const u = await dbUsers.get(username);
    if (!u || u.hash !== hashPassword(password || '', u.salt)) {
      return res.json({ ok: false, msg: '用户名或密码错误' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await dbTokens.set(token, username);
    res.json({ ok: true, token, username });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
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
    const body = req.body || {};
    if (typeof body !== 'object') return res.json({ ok: false, msg: '数据格式错误' });
    const syncedAt = await dbData.set(username, body);
    res.json({ ok: true, syncedAt });
  } catch (e) { res.json({ ok: false, msg: '服务器错误' }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'qinglian-backend', mode: USE_PG ? 'postgres' : 'file', time: Date.now() }));

module.exports = app;
module.exports.initDB = initDB;
module.exports.USE_PG = USE_PG;
