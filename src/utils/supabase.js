import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
