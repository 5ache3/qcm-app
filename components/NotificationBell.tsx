"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, CheckCheck } from "lucide-react"
import {
  getRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(app)/notifications/actions"
import type { NotificationRow } from "@/app/(app)/notifications/NotificationsPageClient"

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return `Il y a ${Math.floor(diff / 86400)} j`
}

interface Props {
  unreadCount: number
}

export function NotificationBell({ unreadCount: initialUnread }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  async function handleToggle() {
    if (!open && notifications === null) {
      setLoading(true)
      const data = await getRecentNotifications()
      setNotifications(data as NotificationRow[])
      setLoading(false)
    }
    setOpen((v) => !v)
  }

  function handleClick(n: NotificationRow) {
    if (!n.read) {
      setNotifications((prev) => prev?.map((x) => x.id === n.id ? { ...x, read: true } : x) ?? null)
      setUnreadCount((c) => Math.max(0, c - 1))
      startTransition(() => markNotificationRead(n.id))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  function handleMarkAll() {
    setNotifications((prev) => prev?.map((x) => ({ ...x, read: true })) ?? null)
    setUnreadCount(0)
    startTransition(() => markAllNotificationsRead())
  }

  const hasUnread = (notifications?.some((n) => !n.read)) ?? unreadCount > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-lg border bg-card shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-sm font-semibold">Notifications</p>
            {hasUnread && (
              <button
                onClick={handleMarkAll}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-6 w-6 mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${n.read ? "" : "bg-primary/5"}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.read ? "text-muted-foreground" : "font-medium"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir toutes les notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
