import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow: static assets, login, profile, auth callbacks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/profile") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not logged in — layout will handle the redirect to /login
  if (!user) return response

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single()

  if (profile?.status === "pending") {
    return NextResponse.redirect(new URL("/profile", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
