-- =========================================================================
-- OPUSZYRA POSTGRESQL SCHEMA FOR SUPABASE
-- Compatible with Supabase SQL Editor and local PostgreSQL instances
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Optional foreign key to auth.users if Supabase Auth is enabled
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    key_prefix VARCHAR(32) NOT NULL,
    key_token VARCHAR(128) NOT NULL UNIQUE,
    tier VARCHAR(20) NOT NULL DEFAULT '5x' CHECK (tier IN ('5x', '20x', 'custom')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked', 'expired')),
    rate_limit_rpm INT NOT NULL DEFAULT 60,
    rate_limit_tpm INT NOT NULL DEFAULT 400000,
    window_token_limit BIGINT NOT NULL DEFAULT 25000000,
    window_tokens_used BIGINT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_resets_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 hours'),
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    total_requests INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. Usage Logs Table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cached_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    status_code INT NOT NULL DEFAULT 200,
    endpoint VARCHAR(100) NOT NULL DEFAULT '/v1/messages',
    client_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crypto Orders / Subscriptions Table
CREATE TABLE IF NOT EXISTS public.crypto_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier VARCHAR(20) NOT NULL,
    amount_usdt NUMERIC(10, 2) NOT NULL,
    wallet_network VARCHAR(20) NOT NULL DEFAULT 'TRC20',
    wallet_address VARCHAR(128) NOT NULL,
    tx_hash VARCHAR(128),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed')),
    assigned_key_id UUID REFERENCES public.api_keys(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_token ON public.api_keys(key_token);
CREATE INDEX IF NOT EXISTS idx_usage_logs_key_id ON public.usage_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_orders ENABLE ROW LEVEL SECURITY;

-- Allow public access with anon / service role for proxy operations
CREATE POLICY "Public read for key validation" ON public.api_keys FOR SELECT USING (true);
CREATE POLICY "Public insert for key creation" ON public.api_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for usage tracking" ON public.api_keys FOR UPDATE USING (true);
CREATE POLICY "Public delete for key revocation" ON public.api_keys FOR DELETE USING (true);

CREATE POLICY "Public read logs" ON public.usage_logs FOR SELECT USING (true);
CREATE POLICY "Public insert logs" ON public.usage_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public orders access" ON public.crypto_orders FOR ALL USING (true);

-- Seed Initial Demo Keys for immediate testing and Key Inspector demo
INSERT INTO public.api_keys (
    id,
    name,
    key_prefix,
    key_token,
    tier,
    status,
    rate_limit_rpm,
    rate_limit_tpm,
    window_token_limit,
    window_tokens_used,
    window_started_at,
    window_resets_at,
    total_tokens_consumed,
    total_requests
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'Standard Dev Key (5x Tier)',
    'opm-live-5x',
    'opm-live-5x-9f8a3c2e1b4d7f0a',
    '5x',
    'active',
    60,
    400000,
    25000000,
    4280500,
    (NOW() - INTERVAL '1 hour 25 minutes'),
    (NOW() + INTERVAL '3 hours 35 minutes'),
    8420000,
    142
),
(
    '00000000-0000-0000-0000-000000000002',
    'Heavy Agentic Key (20x Tier)',
    'opm-live-20x',
    'opm-live-20x-8d7e6f5c4b3a2109',
    '20x',
    'active',
    120,
    1000000,
    20000000,
    1245000,
    (NOW() - INTERVAL '40 minutes'),
    (NOW() + INTERVAL '4 hours 20 minutes'),
    45600000,
    894
)
ON CONFLICT (key_token) DO NOTHING;
