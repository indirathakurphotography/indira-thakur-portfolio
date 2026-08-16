import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/** Normalize the Supabase URL: strip any path suffix like /rest/v1/ */
export function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/** Resolves Supabase URL checking all standard Vercel and Supabase environment variable names */
export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
    process.env.SUPABASE_API_URL ||
    '';
  return url ? normalizeSupabaseUrl(url) : '';
}

/** Resolves Supabase Public Anon Key specifically for client browser requests */
export function getSupabaseAnonKey(): string {
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

/** Resolves Supabase API key (service role or anon) checking all standard env names */
export function getSupabaseKey(): string {
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    getSupabaseAnonKey();
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

/** Returns diagnostic details about Supabase environment variable resolution */
export function getSupabaseInitDetails() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return {
    urlPresent: !!url,
    keyPresent: !!key,
    normalizedUrl: url,
    detectedVars: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_PROJECT_URL: !!process.env.SUPABASE_PROJECT_URL,
      NEXT_PUBLIC_SUPABASE_PROJECT_URL: !!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
      SUPABASE_API_URL: !!process.env.SUPABASE_API_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_PUBLIC_KEY: !!process.env.SUPABASE_PUBLIC_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
    },
  };
}

/** Resolves Supabase Service Role Key specifically for server-side admin operations */
export function getSupabaseServiceRoleKey(): string {
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SUPABASE_ROLE_KEY ||
    process.env.SUPABASE_SECRET ||
    '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

/** Creates a fresh server-side admin Supabase client strictly using service_role key */
export function getSupabaseAdminClient(): { client: SupabaseClient; keyUsedSummary: string; isServiceRole: boolean } {
  const rawUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const keyToUse = serviceRoleKey || getSupabaseKey();
  const isServiceRole = Boolean(serviceRoleKey);

  console.log(`[Supabase Admin Trace] SUPABASE_SERVICE_ROLE_KEY exists: ${isServiceRole}`);

  if (!keyToUse) {
    const errorMsg = `[Supabase Admin Error] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is configured in environment variables.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const client = createClient(rawUrl, keyToUse, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const keyUsedSummary = `${keyToUse.substring(0, 12)}...${keyToUse.substring(keyToUse.length - 6)}`;
  console.log(`[Supabase Admin Trace] Created admin client (isServiceRole: ${isServiceRole}) with key: ${keyUsedSummary}`);

  return { client, keyUsedSummary, isServiceRole };
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const details = getSupabaseInitDetails();
    const rawUrl = getSupabaseUrl();
    const key = getSupabaseKey();

    if (!rawUrl || !key) {
      const errorMsg = `Supabase initialization failed: URL is ${details.urlPresent ? 'PRESENT' : 'MISSING'}, Key is ${details.keyPresent ? 'PRESENT' : 'MISSING'}. Detected env vars: ${JSON.stringify(details.detectedVars)}`;
      console.error('[Supabase Client Error]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      _supabase = createClient(rawUrl, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      console.log(`[Supabase Client Init] SUCCESS: Initialized client for URL "${rawUrl}"`);
    } catch (err) {
      const errorMsg = `Supabase createClient failed for URL "${rawUrl}": ${err instanceof Error ? err.message : String(err)}`;
      console.error('[Supabase Client Error]', errorMsg);
      throw new Error(errorMsg);
    }
  }
  return _supabase;
}

