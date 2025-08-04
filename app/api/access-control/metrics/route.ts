import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organization = searchParams.get("organization")

    if (!organization || organization !== user.organization) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get access rules metrics
    const rulesCount = await sql`
      SELECT 
        COUNT(*) as total_rules,
        COUNT(*) FILTER (WHERE status = 'active') as active_rules,
        MAX(updated_at) as last_modified
      FROM access_rules 
      WHERE organization = ${organization}
    `

    // Get denied attempts (placeholder - would come from audit logs)
    const deniedAttempts = 0

    const metrics = {
      totalRules: Number.parseInt(rulesCount[0]?.total_rules || "0"),
      activeRules: Number.parseInt(rulesCount[0]?.active_rules || "0"),
      lastModified: rulesCount[0]?.last_modified || null,
      deniedAttempts,
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("Error fetching access control metrics:", error)
    return NextResponse.json({
      metrics: {
        totalRules: 0,
        activeRules: 0,
        lastModified: null,
        deniedAttempts: 0,
      },
    })
  }
}
