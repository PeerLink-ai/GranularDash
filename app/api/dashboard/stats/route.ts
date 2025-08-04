import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get total agents
    const [totalAgentsResult] = await sql`
      SELECT COUNT(*) as count FROM connected_agents
    `
    const totalAgents = Number.parseInt(totalAgentsResult.count)

    // Get active agents
    const [activeAgentsResult] = await sql`
      SELECT COUNT(*) as count FROM connected_agents WHERE status = 'active'
    `
    const activeAgents = Number.parseInt(activeAgentsResult.count)

    // Get total violations
    const [totalViolationsResult] = await sql`
      SELECT COUNT(*) as count FROM policy_violations
    `
    const totalViolations = Number.parseInt(totalViolationsResult.count)

    // Get critical violations
    const [criticalViolationsResult] = await sql`
      SELECT COUNT(*) as count FROM policy_violations WHERE severity = 'high' AND status = 'open'
    `
    const criticalViolations = Number.parseInt(criticalViolationsResult.count)

    return NextResponse.json({
      totalAgents,
      activeAgents,
      totalViolations,
      criticalViolations,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({
      totalAgents: 0,
      activeAgents: 0,
      totalViolations: 0,
      criticalViolations: 0,
    })
  }
}
