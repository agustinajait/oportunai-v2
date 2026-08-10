import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy Supabase client — created on first call, not at module load time.
 * This avoids "supabaseUrl is required" errors during Next.js build when
 * env vars are not available.
 */
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
