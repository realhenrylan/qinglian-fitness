// 本地启动器：node server.js（文件存储模式；配置 DATABASE_URL 后自动切换 PostgreSQL）
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = require('./app');

if (!app.USE_PG) {
  // 文件模式：确保目录存在
  const DATA_DIR = path.join(__dirname, 'data');
  const USER_DATA_DIR = path.join(DATA_DIR, 'userdata');
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  if (!fs.existsSync(path.join(DATA_DIR, 'users.json'))) fs.writeFileSync(path.join(DATA_DIR, 'users.json'), '{}');
  if (!fs.existsSync(path.join(DATA_DIR, 'tokens.json'))) fs.writeFileSync(path.join(DATA_DIR, 'tokens.json'), '{}');
} else {
  app.initDB();
}

// 静态托管网页版（仅本地模式；Netlify 部署时由 netlify.toml 处理）
app.use(express.static(path.join(__dirname, '..', 'website')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'website', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`轻练后端已启动: http://localhost:${PORT} (存储模式: ${app.USE_PG ? 'PostgreSQL' : 'JSON文件'})`);
});
