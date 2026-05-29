import { createAdminClient } from "./supabase/admin"

export async function createNotification(n: {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  data?: Record<string, unknown>
}) {
  try {
    const admin = createAdminClient()
    await admin.from("notifications").insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      data: n.data ?? null,
    })
  } catch {
    // notifications are non-critical — never throw
  }
}
