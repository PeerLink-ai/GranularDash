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
    const category = searchParams.get("category")
    const timeRange = searchParams.get("timeRange") || "24h"
    const includeHistory = searchParams.get("history") === "true"

    // Get KPI definitions
    let kpiQuery = `
      SELECT * FROM analytics_kpis 
      WHERE is_active = true
    `

    const kpiParams = []

    if (category) {
      kpiQuery += ` AND kpi_category = $${kpiParams.length + 1}`
      kpiParams.push(category)
    }

    kpiQuery += ` ORDER BY kpi_category, kpi_name`

    const kpis = await sql(kpiQuery, kpiParams)

    // Calculate current KPI values
    const kpiValues = await Promise.all(
      kpis.map(async (kpi) => {
        const currentValue = await calculateKPIValue(kpi, session.user.id)
        let history = []

        if (includeHistory) {
          history = await sql(
            `
            SELECT 
              calculated_value,
              target_value,
              variance_percent,
              status,
              period_start,
              period_end
            FROM analytics_kpi_values 
            WHERE kpi_id = $1 
              AND period_start >= NOW() - INTERVAL '${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "24 hours"}'
            ORDER BY period_start DESC
            LIMIT 100
          `,
            [kpi.id],
          )
        }

        return {
          ...kpi,
          current_value: currentValue.value,
          status: currentValue.status,
          variance_percent: currentValue.variance_percent,
          last_calculated: currentValue.calculated_at,
          history,
        }
      }),
    )

    // Get KPI categories summary
    const categoryStats = await sql(`
      SELECT 
        kpi_category,
        COUNT(*) as total_kpis,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_kpis
      FROM analytics_kpis 
      GROUP BY kpi_category
      ORDER BY kpi_category
    `)

    return NextResponse.json({
      kpis: kpiValues,
      category_stats: categoryStats,
      time_range: timeRange,
    })
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function calculateKPIValue(kpi: any, userId: string) {
  try {
    let value = 0
    let status = "normal"
    let variancePercent = 0

    // Calculate based on KPI formula
    switch (kpi.kpi_name) {
      case "Agent Response Time":
        const responseTimeResult = await sql(
          `
          SELECT AVG(response_time_ms) as avg_response_time
          FROM agent_performance_metrics 
          WHERE user_id = $1 
            AND recorded_at >= NOW() - INTERVAL '1 hour'
        `,
          [userId],
        )
        value = responseTimeResult[0]?.avg_response_time || 0
        break

      case "Agent Success Rate":
        const successRateResult = await sql(
          `
          SELECT AVG(success_rate) as avg_success_rate
          FROM agent_performance_metrics 
          WHERE user_id = $1 
            AND recorded_at >= NOW() - INTERVAL '1 hour'
        `,
          [userId],
        )
        value = successRateResult[0]?.avg_success_rate || 0
        break

      case "Daily Active Agents":
        const activeAgentsResult = await sql(
          `
          SELECT COUNT(DISTINCT agent_id) as active_agents
          FROM agent_performance_metrics 
          WHERE user_id = $1 
            AND recorded_at >= NOW() - INTERVAL '24 hours'
        `,
          [userId],
        )
        value = activeAgentsResult[0]?.active_agents || 0
        break

      case "Token Consumption Rate":
        const tokenResult = await sql(
          `
          SELECT COALESCE(SUM(tokens_consumed), 0) as total_tokens
          FROM analytics_fact_agent_usage 
          WHERE user_id = $1 
            AND date_key = TO_CHAR(NOW(), 'YYYYMMDD')::INTEGER
        `,
          [userId],
        )
        value = tokenResult[0]?.total_tokens || 0
        break

      case "Error Rate":
        const errorRateResult = await sql(
          `
          SELECT 
            CASE 
              WHEN SUM(requests_count) > 0 
              THEN (SUM(error_count)::DECIMAL / SUM(requests_count)) * 100
              ELSE 0 
            END as error_rate
          FROM analytics_fact_agent_usage 
          WHERE user_id = $1 
            AND date_key = TO_CHAR(NOW(), 'YYYYMMDD')::INTEGER
        `,
          [userId],
        )
        value = errorRateResult[0]?.error_rate || 0
        break

      case "Cost Per Request":
        const costResult = await sql(
          `
          SELECT 
            CASE 
              WHEN SUM(requests_count) > 0 
              THEN SUM(cost_estimated) / SUM(requests_count)
              ELSE 0 
            END as cost_per_request
          FROM analytics_fact_agent_usage 
          WHERE user_id = $1 
            AND date_key = TO_CHAR(NOW(), 'YYYYMMDD')::INTEGER
        `,
          [userId],
        )
        value = costResult[0]?.cost_per_request || 0
        break

      default:
        // Custom KPI calculation would go here
        value = 0
    }

    // Determine status based on thresholds
    if (kpi.critical_threshold !== null) {
      if (
        (kpi.kpi_name.includes("Rate") && value < kpi.critical_threshold) ||
        (!kpi.kpi_name.includes("Rate") && value > kpi.critical_threshold)
      ) {
        status = "critical"
      } else if (
        (kpi.kpi_name.includes("Rate") && value < kpi.warning_threshold) ||
        (!kpi.kpi_name.includes("Rate") && value > kpi.warning_threshold)
      ) {
        status = "warning"
      } else if (kpi.target_value && value > kpi.target_value * 1.1) {
        status = "excellent"
      }
    }

    // Calculate variance from target
    if (kpi.target_value) {
      variancePercent = ((value - kpi.target_value) / kpi.target_value) * 100
    }

    return {
      value: Number.parseFloat(value.toFixed(4)),
      status,
      variance_percent: Number.parseFloat(variancePercent.toFixed(2)),
      calculated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error calculating KPI value:", error)
    return {
      value: 0,
      status: "error",
      variance_percent: 0,
      calculated_at: new Date().toISOString(),
    }
  }
}
