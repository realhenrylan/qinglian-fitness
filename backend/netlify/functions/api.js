// Netlify Functions 入口：将 Express 应用包装为 Serverless 函数
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
