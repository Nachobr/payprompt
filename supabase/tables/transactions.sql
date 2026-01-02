CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit',
    'deduction')),
    amount DECIMAL(18,8) NOT NULL,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);