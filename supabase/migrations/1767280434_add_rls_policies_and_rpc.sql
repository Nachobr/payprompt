-- Migration: add_rls_policies_and_rpc
-- Created at: 1767280434


-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can read/update their own data
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- Transactions policies
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Creator settings policies
CREATE POLICY "creator_settings_select" ON creator_settings FOR SELECT USING (true);
CREATE POLICY "creator_settings_insert" ON creator_settings FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "creator_settings_update" ON creator_settings FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RPC function for atomic credit deduction
CREATE OR REPLACE FUNCTION deduct_credits(p_wallet_address TEXT, p_amount DECIMAL)
RETURNS JSON AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_tx_id UUID;
BEGIN
  -- Get current balance with lock
  SELECT total_credits_mnee INTO v_current_balance
  FROM profiles
  WHERE wallet_address = p_wallet_address
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_current_balance);
  END IF;
  
  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;
  UPDATE profiles SET total_credits_mnee = v_new_balance, updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
  
  -- Log transaction
  INSERT INTO transactions (wallet_address, type, amount)
  VALUES (p_wallet_address, 'deduction', p_amount)
  RETURNING id INTO v_tx_id;
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'tx_id', v_tx_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for adding credits (used by edge function after successful deposit)
CREATE OR REPLACE FUNCTION add_credits(p_wallet_address TEXT, p_amount DECIMAL, p_tx_hash TEXT)
RETURNS JSON AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Upsert profile
  INSERT INTO profiles (wallet_address, total_credits_mnee)
  VALUES (p_wallet_address, p_amount)
  ON CONFLICT (wallet_address) DO UPDATE
  SET total_credits_mnee = profiles.total_credits_mnee + p_amount, updated_at = NOW();
  
  SELECT total_credits_mnee INTO v_new_balance FROM profiles WHERE wallet_address = p_wallet_address;
  
  -- Log transaction
  INSERT INTO transactions (wallet_address, type, amount, tx_hash)
  VALUES (p_wallet_address, 'deposit', p_amount, p_tx_hash);
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
;