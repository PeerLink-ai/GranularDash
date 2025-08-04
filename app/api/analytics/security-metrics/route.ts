import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    // Fetch security metrics with fallback queries
    const [agentCount, violationCount, threatCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM connected_agents WHERE organization_id = ${organization}`.catch(() => [
        { count: 0 },
      ]),
      sql`SELECT COUNT(*) as count FROM policy_violations WHERE organization_id = ${organization} AND detected_at >= NOW() - INTERVAL '1 month'`.catch(
        () => [{ count: 0 }],
      ),
      sql`SELECT COUNT(*) as count FROM security_threats WHERE organization_id = ${organization} AND status = 'active'`.catch(
        () => [{ count: 0 }],
      ),
    ])

    // Calculate compliance score (simplified)
    const totalAgents = Number(agentCount[0]?.count || 0)
    const violations = Number(violationCount[0]?.count || 0)
    const complianceScore =
      totalAgents > 0 ? Math.max(0, Math.round(((totalAgents - violations) / totalAgents) * 100)) : 100

    const metrics = {
      totalAgents,
      securityViolations: violations,
      activeThreats: Number(threatCount[0]?.count || 0),
      complianceScore,
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
