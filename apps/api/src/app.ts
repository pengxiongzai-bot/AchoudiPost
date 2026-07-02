import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import bcrypt from "bcryptjs";
import Fastify, { type FastifyInstance } from "fastify";
import { buildSearchIndex } from "@freedompost/search";
import {
  COMMENT_ATTACHMENT_MAX_BYTES,
  COMMENT_MAX_LENGTH,
  hashVisitorKey,
  newToken,
  sanitizeCommentText,
  sha256
} from "@freedompost/security";
import type { Comment } from "@freedompost/shared";
import { commentsBySlug, listPosts, posts, rerenderPost, toPostListItem, toSearchDocument } from "./seed.js";

const sessions = new Map<string, { username: string; createdAt: string }>();
const viewed = new Set<string>();
const rateBuckets = new Map<string, number[]>();

const adjectives = ["安静的", "自由的", "清醒的", "温和的", "明亮的", "专注的", "透明的", "从容的"];
const nouns = ["河流", "山影", "晨光", "星火", "纸页", "远帆", "云层", "石径"];

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  app.register(cors, {
    origin: true,
    credentials: true
  });
  app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? "freedompost-dev-cookie-secret"
  });

  app.get("/health", async () => ({
    ok: true,
    service: "freedompost-api",
    time: new Date().toISOString()
  }));

  app.get("/api/posts", async () => ({
    items: listPosts().map(toPostListItem)
  }));

  app.get<{ Params: { slug: string } }>("/api/posts/:slug", async (request, reply) => {
    const post = listPosts().find((item) => item.slug === request.params.slug);
    if (!post) {
      return reply.code(404).send(errorBody("POST_NOT_FOUND", "文章不存在"));
    }

    return {
      item: {
        ...toPostListItem(post),
        contentHtml: post.html,
        markdown: post.markdown,
        attachmentCount: post.attachmentCount
      }
    };
  });

  app.get("/api/search-index", async () => buildSearchIndex(listPosts().map(toSearchDocument)));

  app.post<{
    Params: { slug: string };
    Body: { fingerprint?: string; localId?: string };
  }>("/api/posts/:slug/view", async (request, reply) => {
    const post = listPosts().find((item) => item.slug === request.params.slug);
    if (!post) {
      return reply.code(404).send(errorBody("POST_NOT_FOUND", "文章不存在"));
    }

    const date = new Date().toISOString().slice(0, 10);
    const visitorKey = hashVisitorKey({
      ip: request.ip,
      fingerprint: request.body?.fingerprint ?? null,
      localId: request.body?.localId ?? null,
      date,
      salt: process.env.VISITOR_HASH_SALT ?? "freedompost-dev"
    });
    const key = `${post.id}:${date}:${visitorKey}`;
    const counted = !viewed.has(key);

    if (counted) {
      viewed.add(key);
      post.viewCount += 1;
      posts.set(post.id, post);
    }

    return {
      counted,
      viewCount: post.viewCount
    };
  });

  app.get<{ Params: { slug: string } }>("/api/posts/:slug/comments", async (request) => ({
    items: commentsBySlug.get(request.params.slug) ?? [],
    nextCursor: null
  }));

  app.post<{
    Params: { slug: string };
    Body: {
      parentId?: string | null;
      content?: string;
      attachmentIds?: string[];
      attachments?: Array<{ id: string; name: string; mimeType: string; sizeBytes: number; url: string }>;
      fingerprint?: string;
      localId?: string;
      captchaToken?: string | null;
    };
  }>("/api/posts/:slug/comments", async (request, reply) => {
    const post = listPosts().find((item) => item.slug === request.params.slug);
    if (!post) {
      return reply.code(404).send(errorBody("POST_NOT_FOUND", "文章不存在"));
    }

    const rawContent = request.body?.content ?? "";
    const attachments = request.body?.attachments ?? [];
    const attachmentBytes = attachments.reduce((sum, item) => sum + item.sizeBytes, 0);

    if (!rawContent.trim() && attachments.length === 0) {
      return reply.code(400).send(errorBody("EMPTY_COMMENT", "评论内容或附件至少需要一项"));
    }

    if (rawContent.length > COMMENT_MAX_LENGTH) {
      return reply.code(400).send(errorBody("COMMENT_TOO_LONG", "评论不能超过 10000 字"));
    }

    if (attachmentBytes > COMMENT_ATTACHMENT_MAX_BYTES) {
      return reply.code(413).send(errorBody("ATTACHMENTS_TOO_LARGE", "单条评论附件总量不能超过 500MB"));
    }

    const rateResult = checkCommentRate({
      postId: post.id,
      ip: request.ip,
      ...(request.body?.fingerprint ? { fingerprint: request.body.fingerprint } : {}),
      ...(request.body?.localId ? { localId: request.body.localId } : {})
    });

    if (rateResult === "daily-limit") {
      return reply.code(429).send(errorBody("DAILY_LIMIT", "该文章今日评论次数已达上限"));
    }

    if (rateResult === "captcha-required" && !request.body?.captchaToken) {
      return reply.code(429).send(errorBody("CAPTCHA_REQUIRED", "评论频率异常，需要验证码"));
    }

    const existing = commentsBySlug.get(post.slug) ?? [];
    const parent = request.body?.parentId
      ? existing.find((comment) => comment.id === request.body?.parentId)
      : undefined;
    const id = crypto.randomUUID();
    const rootId = parent?.rootId ?? parent?.id ?? null;
    const depth = parent ? parent.depth + 1 : 0;
    const siblingCount = existing.filter((comment) => comment.parentId === (parent?.id ?? null)).length;
    const path = parent ? `${parent.path}.${padPath(siblingCount + 1)}` : padPath(existing.filter((c) => !c.parentId).length + 1);
    const comment: Comment = {
      id,
      postSlug: post.slug,
      parentId: parent?.id ?? null,
      rootId,
      depth,
      path,
      username: randomUsername(request.body?.localId ?? request.ip),
      content: sanitizeCommentText(rawContent),
      attachments,
      createdAt: new Date().toISOString()
    };

    commentsBySlug.set(post.slug, [...existing, comment]);
    post.commentCount = commentsBySlug.get(post.slug)?.length ?? post.commentCount;

    return reply.code(201).send(comment);
  });

  app.post<{
    Body: { username?: string; password?: string };
  }>("/api/admin/login", async (request, reply) => {
    const username = request.body?.username ?? "";
    const password = request.body?.password ?? "";
    const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    const expectedPlain = process.env.ADMIN_PASSWORD ?? "freedompost-dev";
    const passwordOk = expectedHash ? await bcrypt.compare(password, expectedHash) : password === expectedPlain;

    if (username !== expectedUser || !passwordOk) {
      return reply.code(401).send(errorBody("BAD_CREDENTIALS", "账号或密码错误"));
    }

    const token = newToken();
    sessions.set(sha256(token), {
      username,
      createdAt: new Date().toISOString()
    });

    reply.setCookie("fp_session", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365
    });

    return { ok: true };
  });

  app.post("/api/admin/logout", async (request, reply) => {
    const token = request.cookies.fp_session;
    if (token) sessions.delete(sha256(token));
    reply.clearCookie("fp_session", { path: "/" });
    return { ok: true };
  });

  app.get("/api/admin/session", async (request, reply) => {
    const session = getSession(request.cookies.fp_session);
    if (!session) {
      return reply.code(401).send(errorBody("UNAUTHENTICATED", "未登录"));
    }
    return { admin: session };
  });

  app.get("/api/admin/posts", async (request, reply) => {
    if (!getSession(request.cookies.fp_session)) {
      return reply.code(401).send(errorBody("UNAUTHENTICATED", "未登录"));
    }
    return {
      items: listPosts()
    };
  });

  app.post<{
    Body: { title?: string; markdown?: string };
  }>("/api/admin/posts", async (request, reply) => {
    if (!getSession(request.cookies.fp_session)) {
      return reply.code(401).send(errorBody("UNAUTHENTICATED", "未登录"));
    }

    const createdAt = new Date().toISOString();
    const id = crypto.randomUUID();
    const slug = makeSlug(request.body?.title ?? "untitled");
    const post = rerenderPost({
      id,
      slug,
      title: request.body?.title?.trim() || "未命名文章",
      markdown: request.body?.markdown ?? "",
      html: "",
      searchText: "",
      excerpt: "",
      createdAt,
      updatedAt: createdAt,
      viewCount: 0,
      commentCount: 0,
      attachmentCount: 0
    });

    posts.set(id, post);
    return reply.code(201).send(post);
  });

  app.put<{
    Params: { id: string };
    Body: { title?: string; markdown?: string };
  }>("/api/admin/posts/:id", async (request, reply) => {
    if (!getSession(request.cookies.fp_session)) {
      return reply.code(401).send(errorBody("UNAUTHENTICATED", "未登录"));
    }

    const post = posts.get(request.params.id);
    if (!post) {
      return reply.code(404).send(errorBody("POST_NOT_FOUND", "文章不存在"));
    }

    const updated = rerenderPost({
      ...post,
      title: request.body?.title?.trim() || post.title,
      markdown: request.body?.markdown ?? post.markdown,
      updatedAt: new Date().toISOString()
    });

    posts.set(post.id, updated);
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/admin/posts/:id", async (request, reply) => {
    if (!getSession(request.cookies.fp_session)) {
      return reply.code(401).send(errorBody("UNAUTHENTICATED", "未登录"));
    }

    const post = posts.get(request.params.id);
    if (!post) {
      return reply.code(404).send(errorBody("POST_NOT_FOUND", "文章不存在"));
    }

    posts.delete(request.params.id);
    commentsBySlug.delete(post.slug);
    return { ok: true };
  });

  return app;
}

function getSession(token: string | undefined) {
  if (!token) return null;
  return sessions.get(sha256(token)) ?? null;
}

function checkCommentRate(input: {
  postId: string;
  ip: string;
  fingerprint?: string;
  localId?: string;
}): "ok" | "daily-limit" | "captcha-required" {
  const subject = sha256([input.ip, input.fingerprint ?? "", input.localId ?? ""].join(":"));
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const dayKey = `${input.postId}:day:${today}:${subject}`;
  const fiveMinKey = `${input.postId}:5min:${subject}`;
  const dayItems = rateBuckets.get(dayKey) ?? [];
  const fiveMinItems = (rateBuckets.get(fiveMinKey) ?? []).filter((time) => now - time < 5 * 60 * 1000);

  if (dayItems.length >= 5) return "daily-limit";
  if (fiveMinItems.length >= 3) return "captcha-required";

  rateBuckets.set(dayKey, [...dayItems, now]);
  rateBuckets.set(fiveMinKey, [...fiveMinItems, now]);
  return "ok";
}

function randomUsername(seed: string): string {
  const hash = sha256(seed || "anonymous");
  const left = Number.parseInt(hash.slice(0, 4), 16);
  const right = Number.parseInt(hash.slice(4, 8), 16);
  return `${adjectives[left % adjectives.length]}${nouns[right % nouns.length]}`;
}

function padPath(value: number): string {
  return String(value).padStart(6, "0");
}

function makeSlug(title: string): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "post";
  return `${base}-${newToken(4).slice(0, 6)}`;
}

function errorBody(code: string, message: string) {
  return {
    error: {
      code,
      message
    }
  };
}
