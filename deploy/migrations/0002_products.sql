CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(32) NOT NULL DEFAULT 'other',
  price_cents INT NOT NULL DEFAULT 0,
  compare_at_cents INT,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  stock INT NOT NULL DEFAULT -1,
  cover_url TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_products_status CHECK (status IN ('draft', 'published')),
  CONSTRAINT chk_products_price CHECK (price_cents >= 0),
  CONSTRAINT chk_products_stock CHECK (stock >= -1)
);

CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status_sort ON products (status, sort_order, created_at DESC);
