export type PlanTier = '5x' | '20x' | '5x_trial' | 'custom';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_token: string;
  tier: PlanTier;
  status: 'active' | 'paused' | 'revoked' | 'expired';
  rate_limit_rpm: number;
  rate_limit_tpm: number;
  window_token_limit: number;
  window_tokens_used: number;
  window_started_at: string;
  window_resets_at: string;
  total_tokens_consumed: number;
  total_requests: number;
  created_at: string;
  expires_at?: string;
  percentUsed?: number;
  percentRemaining?: number;
  timeRemainingFormatted?: string;
  secondsRemaining?: number;
}

export interface CheckKeyData {
  id: string;
  name: string;
  key_token: string;
  masked_token: string;
  tier: PlanTier;
  status: 'active' | 'paused' | 'revoked' | 'expired';
  rate_limit_rpm: number;
  rate_limit_tpm: number;
  window_token_limit: number;
  window_tokens_used: number | null;
  window_tokens_remaining: number | null;
  percentUsed: number | null;
  percentRemaining: number | null;
  timeRemainingFormatted: string;
  secondsRemaining: number;
  window_started_at: string;
  window_resets_at: string;
  total_tokens_consumed: number;
  total_requests: number;
  planSource?: 'provider' | 'database' | 'database_tier' | 'unverified';
  isPlanVerified?: boolean;
  quotaSource?: 'provider' | 'database' | 'configured_tier';
  isQuotaVerified?: boolean;
  usageSource?: 'local_gateway' | 'provider_tokens' | 'provider_percent' | 'database' | 'new_key' | 'unavailable';
  isUsageVerified?: boolean;
  lastSyncTime?: string;
  isStale?: boolean;
  created_at?: string;
  expires_at?: string;
  models_accessible: string[];
  isRealtime?: boolean;
  connectionStatus?: string;
  allowedProviders?: string[];
  successRequests?: number;
  failedRequests?: number;
  last24hRequests?: number;
  allocatedCredits?: number;
  usedCredits?: number;
  remainingCredits?: number;
  unlimited?: boolean;
  windowActive?: boolean;
  planName?: string;
  byModel?: Record<string, { percent: number }>;
  rawPayload?: any;
  recentLogs?: Array<{
    id: string;
    timestamp: string;
    model: string;
    tokens?: number | string;
    status: number | string;
  }>;
}

export interface UsageLog {
  id: string;
  key_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  latency_ms: number;
  status_code: number;
  endpoint: string;
  created_at: string;
}

export interface SystemStats {
  totalKeys: number;
  totalRequests: number;
  totalTokens: number;
  uptime: string;
  gatewayLatencyMs: number;
  activeModelsCount: number;
  supportedArchitectures: string[];
  upstreamUrl?: string;
}

export interface ModelInfo {
  id: string;
  display_name: string;
  created_at?: string;
  type?: string;
  context_window?: number;
}
