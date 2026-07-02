export interface SeedPost {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  markdown: string;
}

export const seedPosts: SeedPost[] = [
  {
    slug: "welcome",
    title: "FreedomPost 第一篇：把阅读体验放在正中间",
    createdAt: "2026-07-02T08:30:00.000Z",
    updatedAt: "2026-07-02T09:10:00.000Z",
    viewCount: 128,
    commentCount: 2,
    markdown: `# FreedomPost 第一篇：把阅读体验放在正中间

FreedomPost 的第一版不是传统博客首页，而是一个专注阅读的三栏工作台：左侧是文章列表，中间是当前文章目录，右侧是正文和评论。

==核心目标== 是让访客通过文章标题或分享链接直接进入内容，不被复杂导航打断。

## 本轮已经落地的体验

- [x] 根路径自动打开最新文章
- [x] 左侧文章列表和本地搜索
- [x] 文章目录默认展开并可折叠
- [x] 点击文章无刷新切换
- [x] 复制文章链接
- [x] 代码块显示语言、行号、复制和折叠

## 内容模型

| 字段 | 说明 |
| --- | --- |
| slug | 短链接 ID |
| title | 文章标题 |
| content | 原始正文 |
| search_text | 搜索文本 |

> 第一版的内容统一作为文章处理，简历、作品、资料和笔记都可以放在同一模型里。

## 代码块示例

\`\`\`ts
interface ArticleCacheItem {
  slug: string;
  html: string;
  cachedAt: number;
}

const cache = new Map<string, ArticleCacheItem>();
\`\`\`

## Mermaid 占位

\`\`\`mermaid
flowchart LR
  A[保存文章] --> B[生成静态产物]
  B --> C[前台无刷新阅读]
\`\`\`

## 下一步

接下来会把后台登录、文章 CRUD、编辑器和发布管线接上，让这个阅读器从静态样本走向真正可用。`
  },
  {
    slug: "architecture-notes",
    title: "架构笔记：读写分离和静态阅读产物",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-02T07:42:00.000Z",
    viewCount: 86,
    commentCount: 0,
    markdown: `# 架构笔记：读写分离和静态阅读产物

FreedomPost 的核心取舍是：管理员写入走 API 和发布管线，访客阅读尽量命中静态文件。

## 写路径

1. 管理员保存文章。
2. 服务端清洗 HTML。
3. 生成 TOC、搜索文本、SEO 元信息。
4. 写入静态 HTML 和 JSON。
5. 更新搜索索引。

## 读路径

访客打开 \`/p/:slug\` 时，Nginx 优先返回静态 HTML。浏览器之后再异步加载文章列表、搜索索引、评论和访问统计。

## 性能预算

| 指标 | 目标 |
| --- | --- |
| 已缓存文章切换 | 小于 50ms |
| 未缓存文章切换 | 尽量小于 200ms |
| 搜索响应 | 小于 100ms |

## 关键原则

正文优先于评论，正文优先于搜索索引，管理后台永远不进入普通访客的阅读 bundle。`
  },
  {
    slug: "comment-safety",
    title: "开放评论，但要认真处理技术安全",
    createdAt: "2026-06-30T17:00:00.000Z",
    updatedAt: "2026-07-01T10:20:00.000Z",
    viewCount: 43,
    commentCount: 1,
    markdown: `# 开放评论，但要认真处理技术安全

评论系统第一版会保持匿名、立即公开、不审核。但开放不等于放弃安全边界。

## 评论规则

- 匿名评论
- 支持楼中楼
- 允许空文字加附件
- 单条评论附件总量不超过 500MB
- 同一设备每天每篇文章最多 5 条

## 安全边界

危险的附件类型不会在评论区内联执行。SVG、HTML、JS、CSS 等内容只作为下载链接展示，并配合 \`nosniff\` 和下载响应头。

## 展示策略

小图可以预览，大图、音视频、文档、压缩包和代码文件只显示下载入口。这样不影响讨论自由，也不把阅读页暴露给脚本执行风险。`
  }
];
