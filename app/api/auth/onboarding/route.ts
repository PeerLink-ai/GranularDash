import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { completeOnboarding, getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const user = await getUserBySession(token)
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    await completeOnboarding(user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Onboarding error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
