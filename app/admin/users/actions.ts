"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approveUser(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { success: false }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)

  if (error) return { success: false }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
