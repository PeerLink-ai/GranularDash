export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ensureAuthSchema } from "@/lib/auth-schema"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function GET(_req: NextRequest) {
  try {
    await ensureAuthSchema()
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get("session")?.value
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await getUserBySession(token)
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error("Auth me error:", err)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
