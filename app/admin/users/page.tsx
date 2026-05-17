import { createClient } from "@/lib/supabase/server"
import { getServerT } from "@/lib/i18n"
import Link from "next/link"
import { Users, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
    .select("id, full_name, role, created_at", { count: "exact" })
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

  if (!profiles || profiles.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-30" />
        <p>Aucun utilisateur pour l&apos;instant.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin_users_title}</h1>
        <p className="text-muted-foreground mt-1">{count} {t.admin_stat_students_count.toLowerCase()}</p>
      </div>

      <div className="space-y-2">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/admin/users/${profile.id}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">
                    {profile.full_name ?? <span className="text-muted-foreground italic">{t.admin_no_name}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.admin_registered_on} {new Date(profile.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground text-xs">
                    {practiceCountMap[profile.id] ?? 0} {t.admin_answers_label} ·{" "}
                    {testCountMap[profile.id] ?? 0} tests
                  </span>
                  <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                    {profile.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
