import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get system component health from monitoring data
    const systemHealth = await sql`
      SELECT 
        component,
        AVG(CASE WHEN metric_name = 'uptime_percentage' THEN metric_value END) as uptime,
        MAX(recorded_at) as last_check,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_issues,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warnings
      FROM system_health_metrics 
      WHERE recorded_at > NOW() - INTERVAL '1 hour'
      GROUP BY component
    `

    // Get agent connection health
    const agentHealth = await sql`
      SELECT 
        COUNT(*) as total_agents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agents,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_agents,
        COUNT(CASE WHEN error_count > 0 THEN 1 END) as agents_with_errors,
        AVG(CASE WHEN last_active IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (NOW() - last_active))/60 
        END) as avg_minutes_since_active
      FROM connected_agents 
      WHERE user_id = ${user.id}
    `

    // Calculate overall system status
    const overallHealth =
      systemHealth.length > 0
        ? systemHealth.every((component) => component.uptime >= 99.0)
          ? "healthy"
          : "warning"
        : "unknown"

    return NextResponse.json({
      systemComponents: systemHealth.map((component) => ({
        name: component.component,
        status: component.uptime >= 99.0 ? "healthy" : component.uptime >= 95.0 ? "warning" : "error",
        uptime: component.uptime || 0,
        description: `${component.critical_issues} critical, ${component.warnings} warnings`,
        lastCheck: component.last_check,
      })),
      agentStats: agentHealth[0] || {
        total_agents: 0,
        active_agents: 0,
        healthy_agents: 0,
        agents_with_errors: 0,
        avg_minutes_since_active: 0,
      },
      overallHealth,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching system health:", error)
    return NextResponse.json({ error: "Failed to fetch system health" }, { status: 500 })
  }
}
