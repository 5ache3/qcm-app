import { createClient } from "@supabase/supabase-js"

// Bypasses RLS — use only for trusted server-side operations
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
