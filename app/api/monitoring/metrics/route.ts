import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const component = searchParams.get("component")
    const timeRange = searchParams.get("timeRange") || "1h"
    const metricType = searchParams.get("metricType")
    const agentId = searchParams.get("agentId")

    // Convert time range to SQL interval
    const timeIntervals = {
      "5m": "5 minutes",
      "15m": "15 minutes",
      "1h": "1 hour",
      "6h": "6 hours",
      "24h": "24 hours",
      "7d": "7 days",
    }

    const interval = timeIntervals[timeRange] || "1 hour"

    let query = `
      SELECT 
        metric_name,
        metric_value,
        metric_unit,
        component,
        severity,
        recorded_at,
        metadata
      FROM system_health_metrics 
      WHERE recorded_at >= NOW() - INTERVAL '${interval}'
    `

    const params = []

    if (component) {
      query += ` AND component = $${params.length + 1}`
      params.push(component)
    }

    if (metricType) {
      query += ` AND metric_name = $${params.length + 1}`
      params.push(metricType)
    }

    query += ` ORDER BY recorded_at DESC LIMIT 1000`

    const systemMetrics = await sql(query, params)

    // Get agent-specific metrics if requested
    let agentMetrics = []
    if (agentId || !component) {
      let agentQuery = `
        SELECT 
          agent_id,
          metric_type,
          metric_value,
          response_time_ms,
          success_rate,
          error_count,
          throughput_rps,
          recorded_at,
          metadata
        FROM agent_performance_metrics 
        WHERE recorded_at >= NOW() - INTERVAL '${interval}'
      `

      const agentParams = []

      if (agentId) {
        agentQuery += ` AND agent_id = $${agentParams.length + 1}`
        agentParams.push(agentId)
      } else {
        agentQuery += ` AND user_id = $${agentParams.length + 1}`
        agentParams.push(session.user.id)
      }

      agentQuery += ` ORDER BY recorded_at DESC LIMIT 1000`

      agentMetrics = await sql(agentQuery, agentParams)
    }

    // Get current alerts
    const alerts = await sql(
      `
      SELECT * FROM monitoring_alerts 
      WHERE status = 'active' 
        AND (user_id = $1 OR user_id IS NULL)
      ORDER BY severity DESC, triggered_at DESC
      LIMIT 50
    `,
      [session.user.id],
    )

    // Calculate aggregated metrics
    const aggregatedMetrics = await sql(`
      SELECT 
        component,
        metric_name,
        AVG(metric_value) as avg_value,
        MAX(metric_value) as max_value,
        MIN(metric_value) as min_value,
        COUNT(*) as data_points
      FROM system_health_metrics 
      WHERE recorded_at >= NOW() - INTERVAL '${interval}'
      GROUP BY component, metric_name
      ORDER BY component, metric_name
    `)

    return NextResponse.json({
      system_metrics: systemMetrics,
      agent_metrics: agentMetrics,
      alerts,
      aggregated_metrics: aggregatedMetrics,
      time_range: timeRange,
      total_data_points: systemMetrics.length + agentMetrics.length,
    })
  } catch (error) {
    console.error("Error fetching monitoring metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { metrics } = await request.json()

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: "Metrics array is required" }, { status: 400 })
    }

    const results = []

    for (const metric of metrics) {
      const { type, component, agent_id, metric_name, value, unit, metadata = {} } = metric

      if (type === "system") {
        // Insert system health metric
        const result = await sql(
          `
          INSERT INTO system_health_metrics (
            metric_name, metric_value, metric_unit, component, metadata, organization_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
          [metric_name, value, unit || "", component, JSON.stringify(metadata), session.user.organization_id],
        )

        results.push({ type: "system", id: result[0].id })

        // Check monitoring rules
        await checkMonitoringRules(component, metric_name, value, session.user.id)
      } else if (type === "agent" && agent_id) {
        // Insert agent performance metric
        const result = await sql(
          `
          INSERT INTO agent_performance_metrics (
            agent_id, user_id, metric_type, metric_value, response_time_ms, 
            success_rate, error_count, throughput_rps, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `,
          [
            agent_id,
            session.user.id,
            metric_name,
            value,
            metadata.response_time_ms || null,
            metadata.success_rate || null,
            metadata.error_count || 0,
            metadata.throughput_rps || null,
            JSON.stringify(metadata),
          ],
        )

        results.push({ type: "agent", id: result[0].id })

        // Check agent-specific monitoring rules
        await checkMonitoringRules("agent", metric_name, value, session.user.id, agent_id)
      }
    }

    return NextResponse.json({
      message: "Metrics recorded successfully",
      recorded_count: results.length,
      results,
    })
  } catch (error) {
    console.error("Error recording monitoring metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkMonitoringRules(
  component: string,
  metricName: string,
  value: number,
  userId: string,
  agentId?: string,
) {
  try {
    // Get applicable monitoring rules
    const rules = await sql(
      `
      SELECT * FROM monitoring_rules 
      WHERE is_active = true 
        AND component = $1 
        AND metric_name = $2
    `,
      [component, metricName],
    )

    for (const rule of rules) {
      let triggered = false

      // Check if rule condition is met
      switch (rule.comparison_operator) {
        case ">":
          triggered = value > rule.threshold_value
          break
        case "<":
          triggered = value < rule.threshold_value
          break
        case ">=":
          triggered = value >= rule.threshold_value
          break
        case "<=":
          triggered = value <= rule.threshold_value
          break
        case "=":
          triggered = value === rule.threshold_value
          break
        case "!=":
          triggered = value !== rule.threshold_value
          break
      }

      if (triggered) {
        // Check if there's already an active alert for this rule
        const existingAlert = await sql(
          `
          SELECT id FROM monitoring_alerts 
          WHERE alert_type = $1 
            AND component = $2 
            AND status = 'active'
            AND triggered_at >= NOW() - INTERVAL '${rule.cooldown_minutes} minutes'
        `,
          [rule.rule_name, component],
        )

        if (existingAlert.length === 0) {
          // Create new alert
          await sql(
            `
            INSERT INTO monitoring_alerts (
              alert_type, severity, title, description, component, 
              agent_id, user_id, auto_resolve, alert_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
            [
              rule.rule_name,
              rule.severity,
              `${rule.rule_name} Alert`,
              `${metricName} value ${value} ${rule.comparison_operator} ${rule.threshold_value} for ${component}`,
              component,
              agentId || null,
              userId,
              rule.auto_resolve_minutes ? true : false,
              JSON.stringify({
                rule_id: rule.id,
                metric_name: metricName,
                metric_value: value,
                threshold: rule.threshold_value,
                operator: rule.comparison_operator,
              }),
            ],
          )
        }
      }
    }
  } catch (error) {
    console.error("Error checking monitoring rules:", error)
  }
}
