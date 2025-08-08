import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (token) {
      try {
        await deleteSession(token)
      } catch (e) {
        // ignore if session row missing
      }
    }
    // Clear cookie
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Sign out error:", err)
    return NextResponse.json({ ok: true })
  }
}
