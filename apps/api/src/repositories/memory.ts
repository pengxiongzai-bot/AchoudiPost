import type { Comment } from "@freedompost/shared";
import {
  makeSlug,
  padPath,
  renderStoredPost,
  toPostListItem,
  toSearchDocument
} from "./post-utils.js";
import type {
  ContentRepository,
  CreateCommentInput,
  CreatePostInput,
  RecordViewInput,
  RecordViewResult,
  StoredPost,
  UpdatePostInput
} from "./types.js";

const now = "2026-07-02T08:30:00.000Z";

export function createSeedPosts(): StoredPost[] {
  return [
    renderStoredPost({
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
    })
  ];
}

export class MemoryContentRepository implements ContentRepository {
  private readonly posts = new Map<string, StoredPost>();
  private readonly commentsBySlug = new Map<string, Comment[]>();
  private readonly views = new Set<string>();

  constructor(seedPosts = createSeedPosts()) {
    for (const post of seedPosts) {
      this.posts.set(post.id, post);
    }
  }

  async listPosts(): Promise<StoredPost[]> {
    return [...this.posts.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async listPostSummaries() {
    const posts = await this.listPosts();
    return posts.map((post) =>
      toPostListItem({
        ...post,
        commentCount: this.commentsBySlug.get(post.slug)?.length ?? post.commentCount
      })
    );
  }

  async getPostBySlug(slug: string): Promise<StoredPost | null> {
    return (await this.listPosts()).find((post) => post.slug === slug) ?? null;
  }

  async getPostById(id: string): Promise<StoredPost | null> {
    return this.posts.get(id) ?? null;
  }

  async getSearchDocuments() {
    return (await this.listPosts()).map(toSearchDocument);
  }

  async createPost(input: CreatePostInput): Promise<StoredPost> {
    const createdAt = new Date().toISOString();
    const post = renderStoredPost({
      id: crypto.randomUUID(),
      slug: makeSlug(input.title),
      title: input.title.trim() || "未命名文章",
      markdown: input.markdown,
      createdAt,
      updatedAt: createdAt,
      viewCount: 0,
      commentCount: 0,
      attachmentCount: 0
    });

    this.posts.set(post.id, post);
    return post;
  }

  async updatePost(input: UpdatePostInput): Promise<StoredPost | null> {
    const post = this.posts.get(input.id);
    if (!post) return null;

    const updated = renderStoredPost({
      ...post,
      title: input.title.trim() || post.title,
      markdown: input.markdown,
      updatedAt: new Date().toISOString()
    });

    this.posts.set(post.id, updated);
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    const post = this.posts.get(id);
    if (!post) return false;

    this.posts.delete(id);
    this.commentsBySlug.delete(post.slug);
    return true;
  }

  async recordView(input: RecordViewInput): Promise<RecordViewResult | null> {
    const post = await this.getPostBySlug(input.postSlug);
    if (!post) return null;

    const key = `${post.id}:${input.viewDate}:${input.visitorKey}`;
    const counted = !this.views.has(key);
    if (counted) {
      this.views.add(key);
      post.viewCount += 1;
      this.posts.set(post.id, post);
    }

    return {
      counted,
      viewCount: post.viewCount
    };
  }

  async listComments(postSlug: string): Promise<Comment[]> {
    return this.commentsBySlug.get(postSlug) ?? [];
  }

  async createComment(input: CreateCommentInput): Promise<Comment | null> {
    const post = await this.getPostBySlug(input.postSlug);
    if (!post) return null;

    const existing = this.commentsBySlug.get(post.slug) ?? [];
    const parent = input.parentId ? existing.find((comment) => comment.id === input.parentId) : undefined;
    const rootId = parent?.rootId ?? parent?.id ?? null;
    const depth = parent ? parent.depth + 1 : 0;
    const siblingCount = existing.filter((comment) => comment.parentId === (parent?.id ?? null)).length;
    const path = parent
      ? `${parent.path}.${padPath(siblingCount + 1)}`
      : padPath(existing.filter((comment) => !comment.parentId).length + 1);

    const comment: Comment = {
      id: crypto.randomUUID(),
      postSlug: post.slug,
      parentId: parent?.id ?? null,
      rootId,
      depth,
      path,
      username: input.username,
      content: input.content,
      attachments: input.attachments,
      createdAt: new Date().toISOString()
    };

    this.commentsBySlug.set(post.slug, [...existing, comment]);
    post.commentCount = this.commentsBySlug.get(post.slug)?.length ?? post.commentCount;
    this.posts.set(post.id, post);
    return comment;
  }

  async deleteAttachmentsByIds(_ids: string[]): Promise<void> {
    // Memory comments own attachment metadata directly, so deleting comments removes it.
  }
}
