import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('getSupabaseClient debug:', { url, key: key ? (key.substring(0, 15) + '...') : null });
  if (!url || !key) {
    console.warn('getSupabaseClient: url or key is missing!');
    return null;
  }
  client = createClient(url, key);
  return client;
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
}
