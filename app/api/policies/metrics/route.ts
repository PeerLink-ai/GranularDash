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

    // Get policies metrics
    const policiesCount = await sql`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE status = 'active') as active_policies,
        MAX(updated_at) as last_updated
      FROM policies 
      WHERE organization = ${organization}
    `

    // Get violations count
    const violationsCount = await sql`
      SELECT COUNT(*) as violations
      FROM policy_violations 
      WHERE organization = ${organization}
      AND created_at >= NOW() - INTERVAL '30 days'
    `

    const metrics = {
      totalPolicies: Number.parseInt(policiesCount[0]?.total_policies || "0"),
      activePolicies: Number.parseInt(policiesCount[0]?.active_policies || "0"),
      lastUpdated: policiesCount[0]?.last_updated || null,
      violations: Number.parseInt(violationsCount[0]?.violations || "0"),
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("Error fetching policy metrics:", error)
    return NextResponse.json({
      metrics: {
        totalPolicies: 0,
        activePolicies: 0,
        lastUpdated: null,
        violations: 0,
      },
    })
  }
}
