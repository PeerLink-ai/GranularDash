import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ensureAuthSchema } from "@/lib/auth-schema"
import { signInUser, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await ensureAuthSchema()

    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await signInUser(email, password)
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { user, sessionToken } = result

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error("Sign in error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
