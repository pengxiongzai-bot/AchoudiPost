import { renderMarkdownArticle } from "@freedompost/renderer";
import type { Comment, PostListItem, SearchDocument } from "@freedompost/shared";

export interface StoredPost {
  id: string;
  slug: string;
  title: string;
  markdown: string;
  html: string;
  searchText: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  attachmentCount: number;
}

const now = "2026-07-02T08:30:00.000Z";

const initialPosts = [
  {
    id: "post-welcome",
    slug: "welcome",
    title: "FreedomPost 第一篇：把阅读体验放在正中间",
    markdown:
      "# FreedomPost 第一篇：把阅读体验放在正中间\n\n这里是 API 的示例文章。真实数据会在接入 PostgreSQL 后从 posts 表读取。\n\n```ts\nconsole.log('FreedomPost')\n```",
    createdAt: now,
    updatedAt: now,
    viewCount: 128,
    commentCount: 0,
    attachmentCount: 0
  }
];

export const posts = new Map<string, StoredPost>(
  initialPosts.map((post) => {
    const rendered = renderMarkdownArticle({
      slug: post.slug,
      title: post.title,
      markdown: post.markdown,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      viewCount: post.viewCount,
      commentCount: post.commentCount,
      attachmentCount: post.attachmentCount
    });

    return [
      post.id,
      {
        ...post,
        html: rendered.html,
        searchText: rendered.searchText,
        excerpt: rendered.excerpt
      }
    ];
  })
);

export const commentsBySlug = new Map<string, Comment[]>();

export function listPosts(): StoredPost[] {
  return [...posts.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function toPostListItem(post: StoredPost): PostListItem {
  return {
    slug: post.slug,
    title: post.title,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    viewCount: post.viewCount,
    commentCount: commentsBySlug.get(post.slug)?.length ?? post.commentCount,
    excerpt: post.excerpt
  };
}

export function toSearchDocument(post: StoredPost): SearchDocument {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    body: post.searchText,
    excerpt: post.excerpt,
    updatedAt: post.updatedAt
  };
}

export function rerenderPost(post: StoredPost): StoredPost {
  const rendered = renderMarkdownArticle({
    slug: post.slug,
    title: post.title,
    markdown: post.markdown,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    viewCount: post.viewCount,
    commentCount: post.commentCount,
    attachmentCount: post.attachmentCount
  });

  return {
    ...post,
    html: rendered.html,
    searchText: rendered.searchText,
    excerpt: rendered.excerpt
  };
}
