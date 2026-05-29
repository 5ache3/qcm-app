"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function joinClass(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const code = inviteCode.trim().toLowerCase()
  if (!code) return { error: "Code vide" }

  // Use admin client so RLS doesn't block a non-member from looking up the class
  const admin = createAdminClient()
  const { data: cls } = await admin
    .from("classes")
    .select("id, name")
    .eq("invite_code", code)
    .single()

  if (!cls) return { error: "Code invalide. Vérifiez auprès de votre enseignant." }

  const { data: existing } = await supabase
    .from("class_memberships")
    .select("status")
    .eq("class_id", cls.id)
    .eq("student_id", user.id)
    .maybeSingle()

  if (existing) {
    return existing.status === "approved"
      ? { error: `Vous êtes déjà membre de "${cls.name}".` }
      : { error: `Votre demande pour "${cls.name}" est déjà en attente d'approbation.` }
  }

  const { error } = await supabase
    .from("class_memberships")
    .insert({ class_id: cls.id, student_id: user.id, status: "pending" })

  if (error) return { error: error.message }
  revalidatePath("/profile")
  return { success: true, className: cls.name }
}

export async function updateProfile(fields: { full_name: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fields.full_name })
    .eq("id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/profile")
  return { success: true }
}

export async function sendPasswordReset() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: "No email on account" }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email)
  if (error) return { error: friendlyAuthError(error.message) }
  return { success: true }
}

function friendlyAuthError(msg: string): string {
  if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email")) {
    return "Too many emails sent recently. Please wait a few minutes and try again."
  }
  return msg
}
