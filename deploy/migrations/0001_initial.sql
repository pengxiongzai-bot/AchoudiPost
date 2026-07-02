CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(32) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  content_markdown TEXT,
  content_html TEXT NOT NULL,
  search_text TEXT NOT NULL,
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  view_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,
  attachment_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts (updated_at DESC);

CREATE TABLE IF NOT EXISTS post_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  html_hash VARCHAR(64) NOT NULL,
  toc_json JSONB NOT NULL,
  asset_manifest JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_artifacts_post_id ON post_artifacts(post_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  root_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  depth INT NOT NULL DEFAULT 0,
  path TEXT NOT NULL,
  username TEXT NOT NULL,
  fingerprint_hash VARCHAR(128),
  local_id_hash VARCHAR(128),
  ip_hash VARCHAR(128) NOT NULL,
  content TEXT,
  attachment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_root ON comments(post_id, root_id, path);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type VARCHAR(32) NOT NULL,
  owner_id UUID,
  uploader_type VARCHAR(32) NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_provider VARCHAR(32) NOT NULL,
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  detected_mime_type TEXT,
  size_bytes BIGINT NOT NULL,
  width INT,
  height INT,
  sha256 VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_attachments_hash ON attachments(sha256);

CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_date DATE NOT NULL,
  visitor_key VARCHAR(128) NOT NULL,
  ip_hash VARCHAR(128),
  fingerprint_hash VARCHAR(128),
  local_id_hash VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, view_date, visitor_key)
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  user_agent_hash VARCHAR(128),
  ip_hash VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS comment_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  subject_type VARCHAR(32) NOT NULL,
  subject_hash VARCHAR(128) NOT NULL,
  window_type VARCHAR(32) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, subject_type, subject_hash, window_type, window_start)
);
