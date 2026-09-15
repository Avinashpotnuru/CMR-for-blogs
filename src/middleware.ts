import { NextResponse, type NextRequest } from "next/server"
import { verifySession } from "@/lib/auth"

const LOGIN_PATH = "/admin/login"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin")
  const isPostsApi =
    pathname === "/api/posts" || pathname.startsWith("/api/posts/")
  const isLoginPage = pathname === LOGIN_PATH

  if (!isAdminPage && !isPostsApi) return NextResponse.next()

  const token = request.cookies.get("admin_session")?.value

  if (isLoginPage) {
    if (token && (await verifySession(token))) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!token || !(await verifySession(token))) {
    if (isPostsApi) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "x-auth-reason": token ? "invalid-session" : "no-session",
          },
        },
      )
    }
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/posts/:path*", "/api/posts"],
}