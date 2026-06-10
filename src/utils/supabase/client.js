// Trả về singleton từ lib/supabase.js để tránh nhiều GoTrueClient cùng lúc
import { supabase } from '@/lib/supabase';

export function createClient() {
  return supabase;
}
