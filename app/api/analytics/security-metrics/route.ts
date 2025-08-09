export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResult = await sql`
      SELECT u.id, u.email, u.organization 
      FROM users u
      JOIN user_sessions s ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      LIMIT 1
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]

    const [agentCount, violationCount, threatCount, complianceScore] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM connected_agents WHERE (organization = ${user.organization} OR organization_id = ${user.organization}) AND (status IS NULL OR status = 'active')`,
      sql`SELECT COUNT(*)::int as count FROM policy_violations WHERE (organization_id = ${user.organization} OR organization = ${user.organization}) AND status = 'open'`,
      sql`SELECT COUNT(*)::int as count FROM security_threats WHERE (organization_id = ${user.organization} OR organization = ${user.organization}) AND status = 'active'`,
      sql`
        SELECT COALESCE(AVG(compliance_score), 100)::numeric as avg_score 
        FROM governance_policies 
        WHERE (organization_id = ${user.organization} OR organization = ${user.organization})
          AND status = 'active'
          AND compliance_score IS NOT NULL
      `,
    ])

    const metrics = {
      totalAgents: Number(agentCount[0]?.count ?? 0),
      securityViolations: Number(violationCount[0]?.count ?? 0),
      activeThreats: Number(threatCount[0]?.count ?? 0),
      complianceScore: Math.round(Number(complianceScore[0]?.avg_score ?? 100)),
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
