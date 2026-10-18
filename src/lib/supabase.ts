import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Supabase client instance (or null placeholder if env not set)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Running in Local Storage & Offline-First mode. Supabase credentials not set in .env.',
    };
  }

  try {
    const { error } = await supabase.from('salons').select('count', { count: 'exact', head: true });
    if (error) {
      return { connected: false, message: `Supabase connection issue: ${error.message}` };
    }
    return { connected: true, message: 'Connected to Supabase PostgreSQL real-time database.' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { connected: false, message: `Connection error: ${errMsg}` };
  }
}
