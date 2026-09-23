// Netlify Functions 入口：将 Express 应用包装为 Serverless 函数
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  throw new Error('DATABASE_URL is required for Netlify Functions; file storage is only for local development.');
}
const serverless = require('serverless-http');
const app = require('../../app');

let ready = false;
async function ensureInit() {
  if (ready) return;
  if (app.USE_PG) await app.initDB();
  ready = true;
}

const handler = serverless(app, { binary: false });
module.exports.handler = async (event, context) => {
  await ensureInit();
  return handler(event, context);
};
