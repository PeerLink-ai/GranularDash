import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User organization:", user.organization)

    // Get access control metrics for the user's organization using correct column names
    const [totalRules, activeRules, recentActivity, violations] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM governance_policies WHERE organization_id = ${user.organization}`,
      sql`SELECT COUNT(*) as count FROM governance_policies WHERE organization_id = ${user.organization} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM audit_logs WHERE organization = ${user.organization} AND action ILIKE '%access%' AND timestamp > NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) as count FROM policy_violations WHERE organization_id = ${user.organization} AND status = 'open'`,
    ])

    const totalPolicies = Number.parseInt(String(totalRules[0]?.count || 0))
    const activePolicies = Number.parseInt(String(activeRules[0]?.count || 0))
    const recentActivityCount = Number.parseInt(String(recentActivity[0]?.count || 0))
    const openViolations = Number.parseInt(String(violations[0]?.count || 0))

    const complianceScore =
      totalPolicies > 0 ? Math.max(0, Math.round(((totalPolicies - openViolations) / totalPolicies) * 100)) : 100

    const result = {
      totalRules: totalPolicies,
      activeRules: activePolicies,
      recentActivity: recentActivityCount,
      complianceScore,
    }

    console.log("Access control metrics result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch access control metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch metrics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
