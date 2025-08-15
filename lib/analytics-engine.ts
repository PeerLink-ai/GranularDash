import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export class AnalyticsEngine {
  // Generate comprehensive analytics insights
  static async generateInsights(userId: string, organizationId?: string) {
    const insights = []

    try {
      // Performance insights
      const performanceInsights = await this.analyzePerformance(userId)
      insights.push(...performanceInsights)

      // Usage pattern insights
      const usageInsights = await this.analyzeUsagePatterns(userId)
      insights.push(...usageInsights)

      // Cost optimization insights
      const costInsights = await this.analyzeCostOptimization(userId)
      insights.push(...costInsights)

      // Anomaly detection insights
      const anomalyInsights = await this.detectAnomalies(userId)
      insights.push(...anomalyInsights)

      // Store insights in database
      for (const insight of insights) {
        await sql(
          `
          INSERT INTO analytics_insights (
            insight_type, category, title, description, severity,
            confidence_score, affected_entities, recommendations,
            insight_data, user_id, organization_id, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            insight.type,
            insight.category,
            insight.title,
            insight.description,
            insight.severity,
            insight.confidence,
            JSON.stringify(insight.affected_entities),
            JSON.stringify(insight.recommendations),
            JSON.stringify(insight.data),
            userId,
            organizationId,
            insight.expires_at,
          ],
        )
      }

      return insights
    } catch (error) {
      console.error("Error generating insights:", error)
      return []
    }
  }

  // Analyze agent performance patterns
  private static async analyzePerformance(userId: string) {
    const insights = []

    // Check for declining performance
    const performanceTrend = await sql(
      `
      SELECT 
        agent_id,
        AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '24 hours' THEN response_time_ms END) as recent_response_time,
        AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '7 days' AND recorded_at < NOW() - INTERVAL '24 hours' THEN response_time_ms END) as baseline_response_time,
        AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '24 hours' THEN success_rate END) as recent_success_rate,
        AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '7 days' AND recorded_at < NOW() - INTERVAL '24 hours' THEN success_rate END) as baseline_success_rate
      FROM agent_performance_metrics 
      WHERE user_id = $1 
        AND recorded_at >= NOW() - INTERVAL '7 days'
      GROUP BY agent_id
      HAVING COUNT(*) >= 10
    `,
      [userId],
    )

    for (const agent of performanceTrend) {
      if (agent.recent_response_time && agent.baseline_response_time) {
        const responseTimeIncrease =
          ((agent.recent_response_time - agent.baseline_response_time) / agent.baseline_response_time) * 100

        if (responseTimeIncrease > 50) {
          insights.push({
            type: "performance_degradation",
            category: "performance",
            title: `Agent ${agent.agent_id} Response Time Degraded`,
            description: `Response time increased by ${responseTimeIncrease.toFixed(1)}% in the last 24 hours`,
            severity: responseTimeIncrease > 100 ? "high" : "medium",
            confidence: 0.85,
            affected_entities: { agents: [agent.agent_id] },
            recommendations: [
              "Check agent resource allocation",
              "Review recent configuration changes",
              "Monitor system load and dependencies",
            ],
            data: {
              recent_response_time: agent.recent_response_time,
              baseline_response_time: agent.baseline_response_time,
              increase_percent: responseTimeIncrease,
            },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })
        }
      }

      if (agent.recent_success_rate && agent.baseline_success_rate) {
        const successRateDecrease = agent.baseline_success_rate - agent.recent_success_rate

        if (successRateDecrease > 5) {
          insights.push({
            type: "success_rate_decline",
            category: "performance",
            title: `Agent ${agent.agent_id} Success Rate Declined`,
            description: `Success rate decreased by ${successRateDecrease.toFixed(1)}% in the last 24 hours`,
            severity: successRateDecrease > 10 ? "high" : "medium",
            confidence: 0.9,
            affected_entities: { agents: [agent.agent_id] },
            recommendations: [
              "Investigate error patterns",
              "Check API endpoint availability",
              "Review authentication and permissions",
            ],
            data: {
              recent_success_rate: agent.recent_success_rate,
              baseline_success_rate: agent.baseline_success_rate,
              decrease_percent: successRateDecrease,
            },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          })
        }
      }
    }

    return insights
  }

  // Analyze usage patterns and trends
  private static async analyzeUsagePatterns(userId: string) {
    const insights = []

    // Check for unusual usage spikes
    const usageSpikes = await sql(
      `
      SELECT 
        agent_id,
        date_key,
        SUM(requests_count) as daily_requests,
        AVG(SUM(requests_count)) OVER (
          PARTITION BY agent_id 
          ORDER BY date_key 
          ROWS BETWEEN 6 PRECEDING AND 1 PRECEDING
        ) as avg_requests_7d
      FROM analytics_fact_agent_usage 
      WHERE user_id = $1 
        AND date_key >= TO_CHAR(NOW() - INTERVAL '14 days', 'YYYYMMDD')::INTEGER
      GROUP BY agent_id, date_key
      HAVING SUM(requests_count) > 0
    `,
      [userId],
    )

    for (const usage of usageSpikes) {
      if (usage.avg_requests_7d && usage.daily_requests > usage.avg_requests_7d * 3) {
        insights.push({
          type: "usage_spike",
          category: "usage",
          title: `Unusual Usage Spike for Agent ${usage.agent_id}`,
          description: `Daily requests (${usage.daily_requests}) are ${Math.round(usage.daily_requests / usage.avg_requests_7d)}x higher than 7-day average`,
          severity: "medium",
          confidence: 0.8,
          affected_entities: { agents: [usage.agent_id] },
          recommendations: [
            "Verify if increased usage is expected",
            "Check for potential abuse or bot activity",
            "Consider scaling resources if legitimate",
          ],
          data: {
            daily_requests: usage.daily_requests,
            average_requests: usage.avg_requests_7d,
            spike_multiplier: usage.daily_requests / usage.avg_requests_7d,
            date: usage.date_key,
          },
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        })
      }
    }

    return insights
  }

  // Analyze cost optimization opportunities
  private static async analyzeCostOptimization(userId: string) {
    const insights = []

    // Check for high-cost, low-usage agents
    const costAnalysis = await sql(
      `
      SELECT 
        agent_id,
        SUM(cost_estimated) as total_cost,
        SUM(requests_count) as total_requests,
        AVG(cost_estimated / NULLIF(requests_count, 0)) as cost_per_request
      FROM analytics_fact_agent_usage 
      WHERE user_id = $1 
        AND date_key >= TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD')::INTEGER
      GROUP BY agent_id
      HAVING SUM(cost_estimated) > 10 -- Only consider agents with significant cost
    `,
      [userId],
    )

    for (const cost of costAnalysis) {
      if (cost.cost_per_request > 0.1 && cost.total_requests < 100) {
        insights.push({
          type: "cost_optimization",
          category: "cost",
          title: `High Cost Per Request for Agent ${cost.agent_id}`,
          description: `Agent has high cost per request ($${cost.cost_per_request.toFixed(4)}) with low usage (${cost.total_requests} requests)`,
          severity: "medium",
          confidence: 0.75,
          affected_entities: { agents: [cost.agent_id] },
          recommendations: [
            "Consider switching to a more cost-effective model",
            "Optimize prompts to reduce token usage",
            "Evaluate if this agent is necessary",
          ],
          data: {
            total_cost: cost.total_cost,
            total_requests: cost.total_requests,
            cost_per_request: cost.cost_per_request,
          },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        })
      }
    }

    return insights
  }

  // Detect anomalies using statistical methods
  private static async detectAnomalies(userId: string) {
    const insights = []

    // Detect response time anomalies using z-score
    const responseTimeAnomalies = await sql(
      `
      WITH stats AS (
        SELECT 
          agent_id,
          AVG(response_time_ms) as mean_response_time,
          STDDEV(response_time_ms) as stddev_response_time
        FROM agent_performance_metrics 
        WHERE user_id = $1 
          AND recorded_at >= NOW() - INTERVAL '7 days'
        GROUP BY agent_id
        HAVING COUNT(*) >= 20 AND STDDEV(response_time_ms) > 0
      ),
      recent_metrics AS (
        SELECT 
          agent_id,
          response_time_ms,
          recorded_at
        FROM agent_performance_metrics 
        WHERE user_id = $1 
          AND recorded_at >= NOW() - INTERVAL '1 hour'
      )
      SELECT 
        r.agent_id,
        r.response_time_ms,
        s.mean_response_time,
        s.stddev_response_time,
        ABS(r.response_time_ms - s.mean_response_time) / s.stddev_response_time as z_score
      FROM recent_metrics r
      JOIN stats s ON r.agent_id = s.agent_id
      WHERE ABS(r.response_time_ms - s.mean_response_time) / s.stddev_response_time > 3
    `,
      [userId],
    )

    for (const anomaly of responseTimeAnomalies) {
      insights.push({
        type: "response_time_anomaly",
        category: "anomaly",
        title: `Response Time Anomaly Detected for Agent ${anomaly.agent_id}`,
        description: `Response time (${anomaly.response_time_ms}ms) is ${anomaly.z_score.toFixed(1)} standard deviations from normal`,
        severity: anomaly.z_score > 5 ? "high" : "medium",
        confidence: Math.min(0.95, 0.5 + anomaly.z_score * 0.1),
        affected_entities: { agents: [anomaly.agent_id] },
        recommendations: [
          "Investigate system performance",
          "Check for resource constraints",
          "Review recent changes to the agent",
        ],
        data: {
          current_response_time: anomaly.response_time_ms,
          mean_response_time: anomaly.mean_response_time,
          z_score: anomaly.z_score,
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
    }

    return insights
  }

  // Predict future usage and performance
  static async generatePredictions(userId: string, days = 7) {
    try {
      // Simple linear regression for usage prediction
      const historicalData = await sql(
        `
        SELECT 
          date_key,
          SUM(requests_count) as total_requests,
          SUM(tokens_consumed) as total_tokens,
          AVG(response_time_avg) as avg_response_time
        FROM analytics_fact_agent_usage 
        WHERE user_id = $1 
          AND date_key >= TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD')::INTEGER
        GROUP BY date_key
        ORDER BY date_key
      `,
        [userId],
      )

      if (historicalData.length < 7) {
        return { error: "Insufficient historical data for predictions" }
      }

      // Calculate trends
      const requestsTrend = this.calculateLinearTrend(historicalData.map((d, i) => ({ x: i, y: d.total_requests })))
      const tokensTrend = this.calculateLinearTrend(historicalData.map((d, i) => ({ x: i, y: d.total_tokens })))

      // Generate predictions
      const predictions = []
      const lastDataPoint = historicalData.length - 1

      for (let i = 1; i <= days; i++) {
        const futureX = lastDataPoint + i
        predictions.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          predicted_requests: Math.max(0, Math.round(requestsTrend.slope * futureX + requestsTrend.intercept)),
          predicted_tokens: Math.max(0, Math.round(tokensTrend.slope * futureX + tokensTrend.intercept)),
          confidence: Math.max(0.3, 0.9 - i * 0.1), // Decreasing confidence over time
        })
      }

      return {
        predictions,
        trends: {
          requests_trend: requestsTrend.slope > 0 ? "increasing" : "decreasing",
          tokens_trend: tokensTrend.slope > 0 ? "increasing" : "decreasing",
        },
        historical_data: historicalData,
      }
    } catch (error) {
      console.error("Error generating predictions:", error)
      return { error: "Failed to generate predictions" }
    }
  }

  // Calculate linear trend using least squares method
  private static calculateLinearTrend(data: { x: number; y: number }[]) {
    const n = data.length
    const sumX = data.reduce((sum, point) => sum + point.x, 0)
    const sumY = data.reduce((sum, point) => sum + point.y, 0)
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0)
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  // Generate automated reports
  static async generateReport(reportId: string, userId: string) {
    try {
      const report = await sql(
        `
        SELECT * FROM analytics_reports 
        WHERE id = $1 AND created_by = $2
      `,
        [reportId, userId],
      )

      if (report.length === 0) {
        return { error: "Report not found" }
      }

      const reportConfig = report[0]
      const queryDef = reportConfig.query_definition

      // Execute report query based on configuration
      let reportData = []

      switch (queryDef.type) {
        case "agent_performance":
          reportData = await this.generateAgentPerformanceReport(userId, queryDef.filters)
          break
        case "usage_summary":
          reportData = await this.generateUsageSummaryReport(userId, queryDef.filters)
          break
        case "cost_analysis":
          reportData = await this.generateCostAnalysisReport(userId, queryDef.filters)
          break
        default:
          return { error: "Unknown report type" }
      }

      // Update report generation stats
      await sql(
        `
        UPDATE analytics_reports 
        SET last_generated_at = NOW(), generation_count = generation_count + 1
        WHERE id = $1
      `,
        [reportId],
      )

      return {
        report_config: reportConfig,
        data: reportData,
        generated_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error generating report:", error)
      return { error: "Failed to generate report" }
    }
  }

  // Generate agent performance report
  private static async generateAgentPerformanceReport(userId: string, filters: any = {}) {
    const timeRange = filters.timeRange || "7d"
    const interval = timeRange === "24h" ? "24 hours" : timeRange === "7d" ? "7 days" : "30 days"

    return await sql(
      `
      SELECT 
        agent_id,
        COUNT(*) as total_requests,
        AVG(response_time_ms) as avg_response_time,
        AVG(success_rate) as avg_success_rate,
        SUM(error_count) as total_errors,
        AVG(throughput_rps) as avg_throughput,
        MIN(recorded_at) as first_request,
        MAX(recorded_at) as last_request
      FROM agent_performance_metrics 
      WHERE user_id = $1 
        AND recorded_at >= NOW() - INTERVAL '${interval}'
      GROUP BY agent_id
      ORDER BY total_requests DESC
    `,
      [userId],
    )
  }

  // Generate usage summary report
  private static async generateUsageSummaryReport(userId: string, filters: any = {}) {
    const timeRange = filters.timeRange || "7d"
    const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30

    return await sql(
      `
      SELECT 
        date_key,
        SUM(requests_count) as total_requests,
        SUM(tokens_consumed) as total_tokens,
        AVG(response_time_avg) as avg_response_time,
        SUM(cost_estimated) as total_cost,
        COUNT(DISTINCT agent_id) as active_agents
      FROM analytics_fact_agent_usage 
      WHERE user_id = $1 
        AND date_key >= TO_CHAR(NOW() - INTERVAL '${days} days', 'YYYYMMDD')::INTEGER
      GROUP BY date_key
      ORDER BY date_key DESC
    `,
      [userId],
    )
  }

  // Generate cost analysis report
  private static async generateCostAnalysisReport(userId: string, filters: any = {}) {
    const timeRange = filters.timeRange || "30d"
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90

    return await sql(
      `
      SELECT 
        agent_id,
        SUM(cost_estimated) as total_cost,
        SUM(requests_count) as total_requests,
        SUM(tokens_consumed) as total_tokens,
        AVG(cost_estimated / NULLIF(requests_count, 0)) as cost_per_request,
        AVG(cost_estimated / NULLIF(tokens_consumed, 0)) as cost_per_token
      FROM analytics_fact_agent_usage 
      WHERE user_id = $1 
        AND date_key >= TO_CHAR(NOW() - INTERVAL '${days} days', 'YYYYMMDD')::INTEGER
      GROUP BY agent_id
      HAVING SUM(cost_estimated) > 0
      ORDER BY total_cost DESC
    `,
      [userId],
    )
  }
}
