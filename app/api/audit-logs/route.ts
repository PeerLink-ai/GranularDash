import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { addAuditLog, listAuditLogs } from "@/lib/audit-store"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") || 50)
    const offset = Number(searchParams.get("offset") || 0)

    const logs = await listAuditLogs({ organization: user.organization, limit, offset })
    return NextResponse.json({ logs })
  } catch (err) {
    console.error("GET /api/audit-logs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    if (!body?.action || !body?.resourceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined
    const userAgent = req.headers.get("user-agent") || undefined

    const log = await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      details: body.details,
      ipAddress,
      userAgent,
    })
    return NextResponse.json({ log })
  } catch (err) {
    console.error("POST /api/audit-logs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
