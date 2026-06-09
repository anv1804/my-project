import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase mới dùng PUBLISHABLE_KEY thay vì ANON_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Kiểm tra URL hợp lệ trước khi tạo client
const isValidUrl = (url) => {
  try {
    return url && new URL(url).protocol.startsWith('http');
  } catch {
    return false;
  }
};

const hasValidConfig = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 10;

// Client-side browser client (dùng trong React components)
export const supabase = hasValidConfig
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-not-configured');

// Server-side client (dùng trong API routes / Server Components)
export const supabaseServer = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key-not-configured', {
      auth: { persistSession: false, autoRefreshToken: false },
    });

export const isSupabaseConfigured = hasValidConfig;
