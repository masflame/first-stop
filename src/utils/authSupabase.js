import { createClient } from "@supabase/supabase-js";

const authSupabaseUrl =
  import.meta.env.VITE_STORAGE_PROJECT_URL ||
  import.meta.env.VITE_PROJECT_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const authSupabaseKey =
  import.meta.env.VITE_STORAGE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authSupabase =
  authSupabaseUrl && authSupabaseKey
    ? createClient(authSupabaseUrl, authSupabaseKey)
    : null;
