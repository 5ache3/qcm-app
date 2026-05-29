import { createClient } from "@/lib/supabase/server"
import { Bell } from "lucide-react"
import { NotificationsPageClient } from "./NotificationsPageClient"

const ACTION_TYPES = ["class_join_request", "user_pending_approval"]

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at, data")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const notifications = rows ?? []

  // Check whether each action notification's action is still pending
  const actionNotifs = notifications.filter((n) => ACTION_TYPES.includes(n.type))

  const doneChecks = await Promise.all(
    actionNotifs.map(async (n) => {
      const ctx = n.data as Record<string, string> | null

      if (n.type === "class_join_request") {
        if (!ctx?.student_id || !ctx?.class_id) return { id: n.id, done: false }
        const { data: m } = await supabase
          .from("class_memberships")
          .select("status")
          .eq("class_id", ctx.class_id)
          .eq("student_id", ctx.student_id)
          .maybeSingle()
        return { id: n.id, done: !m || m.status !== "pending" }
      }

      if (n.type === "user_pending_approval") {
        if (!ctx?.user_id) return { id: n.id, done: false }
        const { data: p } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", ctx.user_id)
          .maybeSingle()
        return { id: n.id, done: !p || p.status !== "pending" }
      }

      return { id: n.id, done: false }
    })
  )

  const actionDoneMap = Object.fromEntries(doneChecks.map(({ id, done }) => [id, done]))

  const notificationsWithStatus = notifications.map((n) => ({
    ...n,
    actionDone: actionDoneMap[n.id] ?? false,
  }))

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <NotificationsPageClient initial={notificationsWithStatus} />
    </div>
  )
}
