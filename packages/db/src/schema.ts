import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 32 }).notNull().unique(),
    title: text("title").notNull(),
    contentJson: jsonb("content_json").notNull(),
    contentMarkdown: text("content_markdown"),
    contentHtml: text("content_html").notNull(),
    searchText: text("search_text").notNull(),
    excerpt: text("excerpt"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    viewCount: bigint("view_count", { mode: "number" }).notNull().default(0),
    commentCount: bigint("comment_count", { mode: "number" }).notNull().default(0),
    attachmentCount: bigint("attachment_count", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    createdAtIdx: index("idx_posts_created_at").on(table.createdAt),
    updatedAtIdx: index("idx_posts_updated_at").on(table.updatedAt)
  })
);

export const postArtifacts = pgTable(
  "post_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    htmlHash: varchar("html_hash", { length: 64 }).notNull(),
    tocJson: jsonb("toc_json").notNull(),
    assetManifest: jsonb("asset_manifest").notNull().default({}),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    postIdIdx: index("idx_post_artifacts_post_id").on(table.postId)
  })
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade"
    }),
    rootId: uuid("root_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade"
    }),
    depth: integer("depth").notNull().default(0),
    path: text("path").notNull(),
    username: text("username").notNull(),
    fingerprintHash: varchar("fingerprint_hash", { length: 128 }),
    localIdHash: varchar("local_id_hash", { length: 128 }),
    ipHash: varchar("ip_hash", { length: 128 }).notNull(),
    content: text("content"),
    attachmentCount: integer("attachment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    postRootIdx: index("idx_comments_post_root").on(table.postId, table.rootId, table.path),
    postCreatedIdx: index("idx_comments_post_created").on(table.postId, table.createdAt),
    parentIdx: index("idx_comments_parent").on(table.parentId)
  })
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerType: varchar("owner_type", { length: 32 }).notNull(),
    ownerId: uuid("owner_id"),
    uploaderType: varchar("uploader_type", { length: 32 }).notNull(),
    originalFilename: text("original_filename").notNull(),
    storedFilename: text("stored_filename").notNull(),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    mimeType: text("mime_type").notNull(),
    detectedMimeType: text("detected_mime_type"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: varchar("sha256", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    ownerIdx: index("idx_attachments_owner").on(table.ownerType, table.ownerId),
    hashIdx: index("idx_attachments_hash").on(table.sha256)
  })
);

export const postViews = pgTable(
  "post_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    viewDate: date("view_date").notNull(),
    visitorKey: varchar("visitor_key", { length: 128 }).notNull(),
    ipHash: varchar("ip_hash", { length: 128 }),
    fingerprintHash: varchar("fingerprint_hash", { length: 128 }),
    localIdHash: varchar("local_id_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueVisitor: unique("uniq_post_views_daily_visitor").on(
      table.postId,
      table.viewDate,
      table.visitorKey
    )
  })
);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  userAgentHash: varchar("user_agent_hash", { length: 128 }),
  ipHash: varchar("ip_hash", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true })
});

export const commentRateLimits = pgTable(
  "comment_rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    subjectType: varchar("subject_type", { length: 32 }).notNull(),
    subjectHash: varchar("subject_hash", { length: 128 }).notNull(),
    windowType: varchar("window_type", { length: 32 }).notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uniqueWindow: unique("uniq_comment_rate_limit_window").on(
      table.postId,
      table.subjectType,
      table.subjectHash,
      table.windowType,
      table.windowStart
    )
  })
);
