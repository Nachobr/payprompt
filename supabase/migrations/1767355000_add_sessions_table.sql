-- Migration: add_sessions_table
-- Created at: 1767355000

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES profiles(wallet_address),
    signature TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
