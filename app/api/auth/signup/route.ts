import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ensureAuthSchema } from "@/lib/auth-schema"
import { signUpUser, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await ensureAuthSchema()

    const { email, password, name, organization, role } = await request.json()
    if (!email || !password || !name || !organization) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { user, sessionToken } = await signUpUser(email, password, name, organization, role)

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
    const msg = err?.message || "Internal server error"
    const status = msg.includes("exists") ? 409 : 500
    console.error("Sign up error:", err)
    return NextResponse.json({ error: msg }, { status })
  }
}
