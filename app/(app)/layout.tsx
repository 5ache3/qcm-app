import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/AppSidebar"
import { MobileNav } from "@/components/MobileNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ])

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} profile={profile} unreadCount={unreadCount ?? 0} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      <MobileNav role={profile?.role ?? "student"} unreadCount={unreadCount ?? 0} />
    </div>
  )
}
