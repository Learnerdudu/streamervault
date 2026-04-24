// External Supabase client — points to the user's own project, NOT Lovable Cloud.
// ⚠️ The anon key below is a publishable key, but it has been pasted in chat publicly.
// Rotate it in your Supabase dashboard (Settings → API) and update this file.
//
// Schema expected on this project:
//   - profiles (id uuid PK, display_name text, avatar_url text, created_at, updated_at)
//   - watch_history (id, user_id, tmdb_id, media_type, title, poster_path,
//                    progress_seconds int, season int?, episode int?, watched_at)
//   - collections (id, user_id, name, emoji, created_at, updated_at)
//   - collection_items (id, collection_id, user_id, tmdb_id, media_type,
//                       title, poster_path, added_at)
// Make sure RLS policies match the originals (auth.uid() = user_id).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dvlsohsdanxyxwvqyshs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bHNvaHNkYW54eXh3dnF5c2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDYzOTUsImV4cCI6MjA5MjQyMjM5NX0.7no5VjFml_va8hPsvDeHy_Mze5ce0xMWe_ibYB1xrY8";

// Untyped (any) — Lovable's auto-generated Database types describe the Cloud DB,
// not your external project. Type safety is traded for ability to repoint.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "sb-external-auth", // separate key so it doesn't collide with Cloud session
  },
});
