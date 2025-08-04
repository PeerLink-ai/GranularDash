import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, organization_id FROM users WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]

    // Get policy metrics for the user's organization
    const [totalPolicies, activePolicies, violations, complianceRate] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM policies WHERE organization_id = ${user.organization_id}`,
      sql`SELECT COUNT(*) as count FROM policies WHERE organization_id = ${user.organization_id} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM policy_violations WHERE organization_id = ${user.organization_id} AND created_at >= NOW() - INTERVAL '30 days'`,
      sql`
        SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 100
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'resolved') * 100.0 / COUNT(*)), 1)
          END as rate
        FROM policy_violations 
        WHERE organization_id = ${user.organization_id} 
        AND created_at >= NOW() - INTERVAL '30 days'
      `,
    ])

    const metrics = {
      totalPolicies: Number.parseInt(totalPolicies[0]?.count || "0"),
      activePolicies: Number.parseInt(activePolicies[0]?.count || "0"),
      recentViolations: Number.parseInt(violations[0]?.count || "0"),
      complianceRate: Number.parseFloat(complianceRate[0]?.rate || "100"),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching policy metrics:", error)
    return NextResponse.json({ error: "Failed to fetch policy metrics" }, { status: 500 })
  }
}
