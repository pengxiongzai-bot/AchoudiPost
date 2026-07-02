# FreedomPost

FreedomPost 是一个个人内容平台 / 单页阅读器 / 轻量 CMS。当前仓库已落地第一批工程骨架：Astro 前台阅读器、Fastify API、React 后台管理、共享包、数据库 schema、Docker Compose、Nginx 和 GitHub Actions。

## 当前范围

- 前台三栏阅读器：文章列表、目录、正文、评论、本地搜索、无刷新文章切换。
- 静态阅读产物形态：`/p/:slug`、`article.fragment.html`、`article.meta.json`、`toc.json`、`search-index.json`。
- API 骨架：健康检查、文章列表/详情、访问统计、匿名评论、管理员登录、文章 CRUD。
- 后台管理骨架：登录、文章列表、新建、编辑、保存、删除、复制链接。
- 后端基础包：Drizzle schema、安全工具、Markdown 渲染、搜索权重、存储适配器。

## 本地开发

```bash
npm install
npm run build
npm run dev
```

前台阅读器默认运行在 `http://127.0.0.1:4321`。

API：

```bash
npm run dev:api
```

后台：

```bash
npm run dev:admin
```

开发默认管理员：

```text
账号：admin
密码：freedompost-dev
```

## 验证

```bash
npm run typecheck
npm test --workspaces --if-present
npm run build
```

## 部署骨架

1. 复制 `.env.example` 为 `.env` 并修改密钥、数据库密码和管理员密码。
2. 构建前台静态产物：`npm run build -w @freedompost/public-reader`。
3. 启动服务：`docker compose -f deploy/docker-compose.yml up -d --build`。
4. 配置真实域名和 Let’s Encrypt 证书路径后启用 `deploy/nginx/freedompost.conf`。

## 下一步开发顺序

1. 将 API 内存仓储替换为 Drizzle + PostgreSQL。
2. 接入 Tiptap/ProseMirror 编辑器和图片粘贴上传。
3. 发布管线写入 `runtime/public` 并原子更新搜索索引。
4. 接入本地磁盘上传和阿里云 OSS 适配器。
5. 完成评论附件安全下载、验证码触发和生产限流。
