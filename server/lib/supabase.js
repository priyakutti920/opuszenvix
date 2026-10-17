import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// In-memory fallback database for instant out-of-the-box experience
class MockSupabaseDatabase {
  constructor() {
    this.apiKeys = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Standard Dev Key (5x Tier)',
        key_prefix: 'opm-live-5x',
        key_token: 'opm-live-5x-9f8a3c2e1b4d7f0a',
        tier: '5x',
        status: 'active',
        rate_limit_rpm: 60,
        rate_limit_tpm: 400000,
        window_token_limit: 25000000,
        window_tokens_used: 4280500,
        window_started_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
        window_resets_at: new Date(Date.now() + 1000 * 60 * 215).toISOString(),
        total_tokens_consumed: 8420000,
        total_requests: 142,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 27).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Heavy Agentic Key (20x Tier)',
        key_prefix: 'opm-live-20x',
        key_token: 'opm-live-20x-8d7e6f5c4b3a2109',
        tier: '20x',
        status: 'active',
        rate_limit_rpm: 120,
        rate_limit_tpm: 1000000,
        window_token_limit: 200000000,
        window_tokens_used: 12450000,
        window_started_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        window_resets_at: new Date(Date.now() + 1000 * 60 * 260).toISOString(),
        total_tokens_consumed: 45600000,
        total_requests: 894,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 23).toISOString(),
      }
    ];

    this.usageLogs = [
      {
        id: 'log-001',
        key_id: '00000000-0000-0000-0000-000000000001',
        model: 'claude-3-7-sonnet-20250219',
        input_tokens: 1420,
        output_tokens: 680,
        cached_tokens: 2800,
        latency_ms: 642,
        status_code: 200,
        endpoint: '/v1/messages',
        created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString()
      },
      {
        id: 'log-002',
        key_id: '00000000-0000-0000-0000-000000000002',
        model: 'claude-3-5-sonnet-20241022',
        input_tokens: 4210,
        output_tokens: 1890,
        cached_tokens: 15400,
        latency_ms: 920,
        status_code: 200,
        endpoint: '/v1/messages',
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString()
      },
      {
        id: 'log-003',
        key_id: '00000000-0000-0000-0000-000000000001',
        model: 'claude-3-opus-20240229',
        input_tokens: 2100,
        output_tokens: 410,
        cached_tokens: 0,
        latency_ms: 1250,
        status_code: 200,
        endpoint: '/v1/messages',
        created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      }
    ];

    this.orders = [];
  }

  from(table) {
    const self = this;
    let dataStore = [];
    if (table === 'api_keys') dataStore = self.apiKeys;
    else if (table === 'usage_logs') dataStore = self.usageLogs;
    else if (table === 'crypto_orders') dataStore = self.orders;

    return {
      select: (fields = '*') => {
        let results = [...dataStore];
        const chain = {
          eq: (col, val) => {
            results = results.filter(item => item[col] === val);
            return chain;
          },
          order: (col, { ascending = true } = {}) => {
            results.sort((a, b) => {
              if (ascending) return a[col] > b[col] ? 1 : -1;
              return a[col] < b[col] ? 1 : -1;
            });
            return chain;
          },
          limit: (n) => {
            results = results.slice(0, n);
            return chain;
          },
          single: async () => {
            return { data: results[0] || null, error: results[0] ? null : { message: 'Row not found' } };
          },
          maybeSingle: async () => {
            return { data: results[0] || null, error: null };
          },
          then: (resolve) => resolve({ data: results, error: null })
        };
        return chain;
      },
      insert: async (records) => {
        const arr = Array.isArray(records) ? records : [records];
        for (const item of arr) {
          const newItem = {
            id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            created_at: item.created_at || new Date().toISOString(),
            ...item
          };
          dataStore.unshift(newItem);
        }
        return { data: arr, error: null };
      },
      update: (updates) => {
        return {
          eq: async (col, val) => {
            let matched = 0;
            dataStore.forEach(item => {
              if (item[col] === val) {
                Object.assign(item, updates);
                matched++;
              }
            });
            return { data: updates, count: matched, error: null };
          }
        };
      },
      delete: () => {
        return {
          eq: async (col, val) => {
            const initialLen = dataStore.length;
            if (table === 'api_keys') {
              self.apiKeys = self.apiKeys.filter(item => item[col] !== val);
            } else if (table === 'usage_logs') {
              self.usageLogs = self.usageLogs.filter(item => item[col] !== val);
            } else if (table === 'crypto_orders') {
              self.orders = self.orders.filter(item => item[col] !== val);
            }
            return { error: null, count: initialLen - dataStore.length };
          }
        };
      }
    };
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : new MockSupabaseDatabase();

console.log(
  isSupabaseConfigured
    ? `[Supabase] Connected to live Supabase instance: ${supabaseUrl}`
    : `[Supabase] Running in high-fidelity mock/local storage mode (Provide SUPABASE_URL & SUPABASE_KEY to switch to live DB)`
);
