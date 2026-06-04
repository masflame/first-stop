// Single shared Supabase client - re-exports authSupabase to avoid
// duplicate GoTrueClient instances in the same browser context.
export { authSupabase as supabase } from "./authSupabase";
