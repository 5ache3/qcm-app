"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function approveOAuthAuthorization(authorizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
  if (error || !data) return { error: error?.message ?? "Autorisation impossible" }
  redirect(data.redirect_url)
}

export async function denyOAuthAuthorization(authorizationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true })
  if (error || !data) return { error: error?.message ?? "Refus impossible" }
  redirect(data.redirect_url)
}
