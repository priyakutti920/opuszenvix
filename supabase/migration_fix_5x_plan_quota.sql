-- =========================================================================
-- OPUSZYRA DATABASE MIGRATION: FIX MAX 5X PLAN QUOTA TO 5,000,000 TOKENS
-- =========================================================================
-- Description:
-- Updates the default window_token_limit for the public.api_keys table from
-- legacy 25,000,000 to the authoritative 5,000,000 tokens per 5-hour window.
-- Safely migrates existing Max 5x keys without resetting usage or granting duplicate quota.
--
-- Migration Strategy:
-- 1. Updates table column default for future provisions.
-- 2. Migrates existing keys for tier '5x' and '5x_trial' that hold legacy/stale limits.
-- 3. Strictly preserves window_tokens_used, total_tokens_consumed, timestamps, and request logs.
-- 4. Strictly leaves 20x tier keys (20,000,000) untouched.
-- =========================================================================

-- Step 1: Update column default for future api_keys insertions
ALTER TABLE public.api_keys 
    ALTER COLUMN window_token_limit SET DEFAULT 5000000;

-- Step 2: Migrate existing 5x and 5x_trial keys with legacy limits (e.g. 25M, 2.5M, 100M, 200M)
UPDATE public.api_keys
SET window_token_limit = 5000000
WHERE tier IN ('5x', '5x_trial')
  AND window_token_limit IN (25000000, 2500000, 100000000, 200000000);

-- Step 3: Verify updated counts
DO $$
DECLARE
    updated_count INT;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.api_keys
    WHERE tier IN ('5x', '5x_trial') AND window_token_limit = 5000000;
    
    RAISE NOTICE 'Migration Complete: % Max 5x keys active with 5,000,000 quota limit.', updated_count;
END $$;
