CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  style TEXT NOT NULL,
  budget NUMERIC(10,2) NOT NULL,
  pay_per_task NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  ref_prefix TEXT NOT NULL,
  tracking_token TEXT,
  destination_url TEXT,
  sg_job_id TEXT,
  reddit_post_url TEXT,
  actual_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tracking_token TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS destination_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS actual_spend NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_tracking_token
  ON campaigns(tracking_token) WHERE tracking_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_sg_job_id ON campaigns(sg_job_id);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  ref TEXT,
  visitor_id TEXT,
  external_id TEXT,
  amount NUMERIC(12,2),
  currency TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency TEXT;

CREATE INDEX IF NOT EXISTS idx_events_campaign ON events(campaign_id, type);
CREATE INDEX IF NOT EXISTS idx_events_ref ON events(ref);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external_unique
  ON events(type, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS webhook_receipts (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, external_id)
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_set_updated_at ON campaigns;
CREATE TRIGGER campaigns_set_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
