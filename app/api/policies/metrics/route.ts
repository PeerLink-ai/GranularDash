import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    // Fetch policy metrics from database
    const [policyStats, violationStats] = await Promise.all([
      sql`
        SELECT 
          COUNT(*) as total_policies,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies
        FROM governance_policies 
        WHERE organization_id = ${user.organization}
      `,
      sql`
        SELECT 
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_violations,
          COUNT(*) as total_violations
        FROM policy_violations 
        WHERE organization_id = ${user.organization}
      `
    ])

    const totalPolicies = parseInt(policyStats[0]?.total_policies || '0')
    const activePolicies = parseInt(policyStats[0]?.active_policies || '0')
    const openViolations = parseInt(violationStats[0]?.open_violations || '0')
    const totalViolations = parseInt(violationStats[0]?.total_violations || '0')
    
    // Calculate compliance rate
    const complianceRate = totalViolations > 0 ? Math.round(((totalViolations - openViolations) / totalViolations) * 100) : 100

    const metrics = {
      totalPolicies,
      activePolicies,
      openViolations,
      complianceRate,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Policy metrics error:", error)
    return NextResponse.json({
      totalPolicies: 0,
      activePolicies: 0,
      openViolations: 0,
      complianceRate: 100,
    })
  }
}
