"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  if (error) return { error: error.message }
  return { success: true }
}
