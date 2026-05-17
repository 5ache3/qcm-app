import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import Link from "next/link"
import { Users, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApproveUserButton } from "@/components/ApproveUserButton"

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [supabase, { t, lang }] = await Promise.all([createClient(), getServerT()])

  const { data: profiles, count } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const userIds = (profiles ?? []).map((p) => p.id)

  const [{ data: testCounts }, { data: practiceCounts }] = await Promise.all([
    supabase
      .from("tests")
      .select("user_id")
      .in("user_id", userIds.length > 0 ? userIds : ["none"])
      .eq("status", "completed"),
    supabase
      .from("practice_answers")
      .select("user_id")
      .in("user_id", userIds.length > 0 ? userIds : ["none"]),
  ])

  const testCountMap: Record<string, number> = {}
  for (const tc of testCounts ?? []) {
    testCountMap[tc.user_id] = (testCountMap[tc.user_id] ?? 0) + 1
  }

  const practiceCountMap: Record<string, number> = {}
  for (const p of practiceCounts ?? []) {
    practiceCountMap[p.user_id] = (practiceCountMap[p.user_id] ?? 0) + 1
  }

  const locale = lang === "ar" ? "ar-MA" : "fr-FR"

  const pending = (profiles ?? []).filter((p) => p.status === "pending")
  const approved = (profiles ?? []).filter((p) => p.status !== "pending")

  if (!profiles || profiles.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-30" />
        <p>Aucun utilisateur pour l&apos;instant.</p>
      </div>
    )
  }

  function UserCard({ profile }: { profile: typeof profiles[number] }) {
    const pct = profile.status === "pending"
    return (
      <Card className={`hover:shadow-sm transition-shadow ${pct ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <Link href={`/admin/users/${profile.id}`} className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="font-medium text-sm truncate">
                  {profile.full_name ?? <span className="text-muted-foreground italic">{t.admin_no_name}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.admin_registered_on} {new Date(profile.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm shrink-0">
                <span className="text-muted-foreground text-xs hidden sm:inline">
                  {practiceCountMap[profile.id] ?? 0} {t.admin_answers_label} ·{" "}
                  {testCountMap[profile.id] ?? 0} tests
                </span>
                <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                  {profile.role}
                </Badge>
              </div>
            </div>
          </Link>
          {profile.status === "pending" && (
            <ApproveUserButton userId={profile.id} />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin_users_title}</h1>
        <p className="text-muted-foreground mt-1">{count} {t.admin_stat_students_count.toLowerCase()}</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            {t.admin_pending_section}
            <Badge variant="warning" className="text-xs">{pending.length}</Badge>
          </div>
          {pending.map((profile) => (
            <UserCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground">{t.admin_users_title}</p>
          )}
          {approved.map((profile) => (
            <UserCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" asChild disabled={page === 1}>
            <Link href={`/admin/users?page=${page - 1}`}>
              <ChevronLeft className="h-4 w-4" />
              {t.admin_prev}
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} {t.admin_page_of} {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link href={`/admin/users?page=${page + 1}`}>
              {t.admin_next}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
