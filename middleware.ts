import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth"

// Routes that don't require authentication
const publicRoutes = ["/auth/signin", "/auth/signup", "/api/auth/signin", "/api/auth/signup"]

// API routes that should return 401 instead of redirect
const apiRoutes = ["/api/"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for session token
  const sessionToken =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get("session")?.value ||
    request.headers.get("x-session-token")

  // If no session token, redirect to sign in
  if (!sessionToken) {
    if (apiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Validate session token
  try {
    const user = await getUserBySession(sessionToken)

    if (!user) {
      if (apiRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set("x-user-id", user.id)
    response.headers.set("x-user-role", user.role)
    response.headers.set("x-user-org", user.organization)

    return response
  } catch (error) {
    console.error("Middleware auth error:", error)

    if (apiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const signInUrl = new URL("/auth/signin", request.url)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
