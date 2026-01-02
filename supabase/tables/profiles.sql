CREATE TABLE profiles (
    wallet_address TEXT PRIMARY KEY,
    username TEXT,
    total_credits_mnee DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);