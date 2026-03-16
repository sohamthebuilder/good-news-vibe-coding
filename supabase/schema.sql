CREATE TABLE articles (
  url_hash TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Anon insert" ON articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon update" ON articles
  FOR UPDATE USING (true);

CREATE INDEX idx_articles_expires_at ON articles (expires_at);
