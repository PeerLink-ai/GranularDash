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

    // Fetch security metrics from database
    const [agentCount, violationCount, threatCount, complianceScore] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM connected_agents WHERE organization = ${user.organization} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM policy_violations WHERE organization_id = ${user.organization} AND status = 'open'`,
      sql`SELECT COUNT(*) as count FROM security_threats WHERE organization_id = ${user.organization} AND status = 'active'`,
      sql`
        SELECT COALESCE(AVG(compliance_score), 100) as avg_score 
        FROM governance_policies 
        WHERE organization_id = ${user.organization} 
        AND status = 'active'
        AND compliance_score IS NOT NULL
      `
    ])

    const metrics = {
      totalAgents: parseInt(agentCount[0]?.count || '0'),
      securityViolations: parseInt(violationCount[0]?.count || '0'),
      activeThreats: parseInt(threatCount[0]?.count || '0'),
      complianceScore: Math.round(complianceScore[0]?.avg_score || 100),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Security metrics error:", error)
    return NextResponse.json({
      totalAgents: 0,
      securityViolations: 0,
      activeThreats: 0,
      complianceScore: 100,
    })
  }
}
