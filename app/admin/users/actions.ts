"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  return profile?.role === "admin" ? supabase : null
}

export async function approveUser(userId: string) {
  const supabase = await assertAdmin()
  if (!supabase) return { success: false }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId)

  if (error) return { success: false }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function changeUserRole(userId: string, role: "student" | "tutor" | "admin") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorisé" }
  if (user.id === userId) return { error: "Vous ne pouvez pas changer votre propre rôle." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { error: "Non autorisé" }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) return { error: error.message }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
