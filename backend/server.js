// 轻练健身后端服务
// 功能：用户注册/登录（token 认证）、训练/饮食/身体数据云同步、静态托管网页版
// 存储：JSON 文件（零原生依赖），后续可平滑迁移数据库
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');   // {username: {salt, hash, createdAt}}
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json'); // {token: {username, createdAt}}
const USER_DATA_DIR = path.join(DATA_DIR, 'userdata');  // 每用户一个 <username>.json

const app = express();
app.use(express.json({ limit: '2mb' }));
// 允许网页版（本地 + surge 公网）跨域调用
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------- 存储工具 ----------
function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, '{}');
}
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJSON(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// ---------- 认证工具 ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}
function authUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  const tokens = readJSON(TOKENS_FILE, {});
  return tokens[token] ? tokens[token].username : null;
}

// ---------- 接口 ----------
// 注册
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.json({ ok: false, msg: '用户名和密码不能为空' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.json({ ok: false, msg: '用户名需为3-20位字母/数字/下划线' });
  if (String(password).length < 6) return res.json({ ok: false, msg: '密码至少6位' });
  const users = readJSON(USERS_FILE, {});
  if (users[username]) return res.json({ ok: false, msg: '用户名已存在' });
  const salt = crypto.randomBytes(16).toString('hex');
  users[username] = { salt, hash: hashPassword(password, salt), createdAt: Date.now() };
  writeJSON(USERS_FILE, users);
  const token = crypto.randomBytes(32).toString('hex');
  const tokens = readJSON(TOKENS_FILE, {});
  tokens[token] = { username, createdAt: Date.now() };
  writeJSON(TOKENS_FILE, tokens);
  res.json({ ok: true, token, username });
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const users = readJSON(USERS_FILE, {});
  const u = users[username];
  if (!u || u.hash !== hashPassword(password || '', u.salt)) {
    return res.json({ ok: false, msg: '用户名或密码错误' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const tokens = readJSON(TOKENS_FILE, {});
  tokens[token] = { username, createdAt: Date.now() };
  writeJSON(TOKENS_FILE, tokens);
  res.json({ ok: true, token, username });
});

// 下载云端数据
app.get('/api/data', (req, res) => {
  const username = authUser(req);
  if (!username) return res.status(401).json({ ok: false, msg: '未登录' });
  const file = path.join(USER_DATA_DIR, username + '.json');
  const data = fs.existsSync(file) ? readJSON(file, {}) : {};
  res.json({ ok: true, username, data, syncedAt: data.syncedAt || null });
});

// 上传云端数据（全量覆盖）
app.put('/api/data', (req, res) => {
  const username = authUser(req);
  if (!username) return res.status(401).json({ ok: false, msg: '未登录' });
  const body = req.body || {};
  if (typeof body !== 'object') return res.json({ ok: false, msg: '数据格式错误' });
  body.syncedAt = Date.now();
  writeJSON(path.join(USER_DATA_DIR, username + '.json'), body);
  res.json({ ok: true, syncedAt: body.syncedAt });
});

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'qinglian-backend', time: Date.now() }));

// ---------- 静态托管网页版 ----------
app.use(express.static(path.join(__dirname, '..', 'website')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'website', 'index.html')));

ensureDirs();
app.listen(PORT, () => {
  console.log(`轻练后端已启动: http://localhost:${PORT}`);
  console.log(`接口: POST /api/register | POST /api/login | GET/PUT /api/data`);
});
