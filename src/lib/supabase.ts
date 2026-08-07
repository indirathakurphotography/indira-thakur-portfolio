import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/** Normalize the Supabase URL: strip any path suffix like /rest/v1/ */
function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return normalizeSupabaseUrl(rawUrl);
}

export function getSupabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

export function getSupabaseInitDetails(): { detectedVars: Record<string, boolean> } {
  return {
    detectedVars: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    },
  };
}

export function getSupabaseAdminClient(): {
  client: SupabaseClient;
  isServiceRole: boolean;
  keyUsedSummary: string;
} {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = getSupabaseAnonKey();

  if (serviceKey) {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return {
      client,
      isServiceRole: true,
      keyUsedSummary: 'service_role',
    };
  }

  const fallbackKey = anonKey || getSupabaseKey();
  const client = createClient(url, fallbackKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return {
    client,
    isServiceRole: false,
    keyUsedSummary: anonKey ? 'anon' : 'none',
  };
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const rawUrl = getSupabaseUrl();
    const key = getSupabaseKey();
    if (!rawUrl || !key) {
      throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    _supabase = createClient(rawUrl, key);
  }
  return _supabase;
}

