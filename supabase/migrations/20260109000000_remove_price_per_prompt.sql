-- Migration: remove_price_per_prompt
-- Created at: 2026-01-09

-- Remove price_per_prompt as we switched to token-based pricing
ALTER TABLE creator_settings DROP COLUMN IF EXISTS price_per_prompt;
