import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_TOASTMASTERS_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_TOASTMASTERS_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_TOASTMASTERS_SUPABASE_URL or VITE_TOASTMASTERS_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in the Toastmasters Supabase project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
