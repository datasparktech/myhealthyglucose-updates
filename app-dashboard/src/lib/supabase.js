import { createClient } from "@supabase/supabase-js";

// Client-side Supabase. ONLY the anon (public) key belongs here.
// The service_role key must never be shipped to the browser — it bypasses
// Row Level Security. Keep it server-side only.
//
// Values come from Vite env vars (.env.local -> see .env.example).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
