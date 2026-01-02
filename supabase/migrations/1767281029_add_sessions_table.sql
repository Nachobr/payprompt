-- Migration: add_sessions_table
-- Created at: 1767281029


-- Sessions table for SIWE authentication
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  signature TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (auth.role() IN ('anon', 'service_role'));

-- Index for faster lookups
CREATE INDEX idx_sessions_wallet ON sessions(wallet_address);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
;