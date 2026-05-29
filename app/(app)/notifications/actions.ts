"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getRecentNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  await supabase.from("notifications").update({ read: true }).eq("id", id)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
  revalidatePath("/notifications")
}
