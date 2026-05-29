"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markNotificationRead, markAllNotificationsRead } from "./actions"

export type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
  actionDone?: boolean
}

const ACTION_TYPES = new Set(["class_join_request", "user_pending_approval"])

type Filter = "all" | "unread" | "action"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",    label: "Toutes" },
  { key: "unread", label: "Non lues" },
  { key: "action", label: "Action requise" },
]

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return `Il y a ${Math.floor(diff / 86400)} j`
}

function actionLabel(type: string) {
  if (type === "class_join_request") return "Approuver l'étudiant"
  if (type === "user_pending_approval") return "Voir les utilisateurs"
  return null
}

export function NotificationsPageClient({ initial }: { initial: NotificationRow[] }) {
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length
  const actionCount = notifications.filter((n) => ACTION_TYPES.has(n.type) && !n.read).length

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read
    if (filter === "action") return ACTION_TYPES.has(n.type)
    return true
  })

  function handleClick(n: NotificationRow) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
      startTransition(() => markNotificationRead(n.id))
    }
    if (n.link) router.push(n.link)
  }

  function handleMarkAll() {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    startTransition(() => markAllNotificationsRead())
  }

  return (
    <div className="space-y-4">
      {/* Filter pills + mark all */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {FILTERS.map(({ key, label }) => {
            const count = key === "unread" ? unreadCount : key === "action" ? actionCount : null
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${filter === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={isPending} className="gap-1.5 text-xs text-muted-foreground h-7">
            <CheckCheck className="h-3.5 w-3.5" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">Aucune notification</p>
          <p className="text-sm mt-1">
            {filter === "unread" ? "Vous n'avez aucune notification non lue." :
             filter === "action" ? "Aucune action requise pour le moment." :
             "Vous êtes à jour !"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((n) => {
            const cta = actionLabel(n.type)
            return (
              <div
                key={n.id}
                className={`rounded-lg border px-4 py-3 transition-colors ${n.read ? "opacity-70" : "border-primary/30 bg-primary/5"}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.read ? "" : "font-medium"}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                    {cta && n.link && (
                      <button
                        onClick={() => !n.actionDone && handleClick(n)}
                        disabled={n.actionDone}
                        className={`mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          n.actionDone
                            ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {n.actionDone ? "Déjà traité" : `${cta} →`}
                      </button>
                    )}
                  </div>
                  {!cta && n.link && (
                    <button
                      onClick={() => handleClick(n)}
                      className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                    >
                      Voir →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
