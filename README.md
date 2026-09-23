# 轻练 · 合理健身

一站式健身管理应用：训练计划、饮食记录、数据统计、云端同步。

## 在线访问

- **网站版**：https://qinglian-fitness-wzy.netlify.app
- **小程序版**：基于 Taro 构建

## 功能概览

| 模块 | 功能 |
|------|------|
| 训练 | 30 套训练计划（减脂/增肌/塑形/入门），动作清单勾选，组间计时器 |
| 饮食 | 热量目标管理，三大营养素，四餐记录，26 种食物按份添加，8 杯饮水打卡 |
| 数据 | 连续打卡天数，7 天耗能柱状图，月度日历，训练记录管理 |
| 我的 | BMI 自动分级，身体数据编辑，目标切换，6 枚成就徽章 |
| 主题 | 跟随系统 / 浅色 / 深色三态切换 |
| 云同步 | 注册/登录，数据上传恢复，换设备登录即可找回 |

## 技术栈

- **前端**：原生 HTML/CSS/JS（PWA，零框架依赖），Taro（小程序版）
- **后端**：Node.js + Express，PostgreSQL（Neon 云数据库）
- **部署**：Netlify Functions + 静态托管，GitHub Actions 自动部署

## 项目结构

```
├── website/          # 网站版（纯前端 PWA）
│   ├── index.html
│   ├── app.js        # 主应用逻辑
│   ├── style.css
│   ├── sw.js         # Service Worker（离线支持）
│   ├── manifest.webmanifest
│   └── icon.svg
├── backend/          # 后端服务
│   ├── app.js        # Express 应用（双模式：PostgreSQL / 文件）
│   ├── server.js     # 本地开发服务器
│   ├── netlify/functions/api.js  # Netlify Functions 入口
│   └── package.json
├── src/              # 小程序源码（Taro）
├── netlify.toml      # Netlify 部署配置
├── .github/workflows/deploy.yml  # CI/CD 自动部署
└── package.json
```

## 本地开发

```bash
# 后端（本地文件模式，无需数据库）
cd backend && npm install && node server.js
# → http://localhost:3000

# 网站版（直接用任意静态服务器）
cd website && npx serve .
# → http://localhost:3000（同源，API 直连后端）
```

Netlify Functions 必须在 Netlify 环境变量中配置 `DATABASE_URL`，并确保变量 scope 包含 Functions；未配置时 API 函数会拒绝启动，避免把临时文件存储误当作持久数据库。本地运行 `backend/server.js` 仍可使用文件模式。

后端默认只允许同源 API 请求。如果网站和 API 使用不同来源（例如分开运行的本地预览），请在后端设置 `CORS_ALLOWED_ORIGINS`，填入需要允许的完整来源；多个来源用逗号分隔，例如 `https://example.com,https://preview.example.com`。不要在列表中加入路径或末尾斜杠。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/register | 注册（用户名 3-20 位字母/数字/下划线，密码 ≥ 6 位） |
| POST | /api/login | 登录（返回 Bearer Token） |
| POST | /api/logout | 注销当前 Bearer Token |
| GET | /api/data | 下载云端数据（需认证） |
| PUT | /api/data | 上传数据到云端（需认证） |
| GET | /api/health | 健康检查 |

登录令牌有效期为 7 天，过期后需要重新登录。Netlify 上登录和注册接口分别按来源 IP 限制为每分钟 20 个请求，超限返回 429；跨域预检请求也会计数。密码长度限制为 6-128 个字符。

## License

MIT
