import { PostgresContentRepository } from "../repositories/postgres.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const repository = new PostgresContentRepository(databaseUrl);

try {
  const posts = await repository.listPosts();
  if (posts.length > 0) {
    console.log("seed skipped: posts already exist");
    process.exit(0);
  }

  const post = await repository.createPost({
    title: "FreedomPost 第一篇：把阅读体验放在正中间",
    markdown:
      "# FreedomPost 第一篇：把阅读体验放在正中间\n\n这是 PostgreSQL 种子文章。保存文章后，FreedomPost 会生成阅读 HTML、目录和搜索文本。\n\n```ts\nconsole.log('FreedomPost')\n```"
  });

  console.log(`seeded post /p/${post.slug}`);
} finally {
  await repository.close();
}
