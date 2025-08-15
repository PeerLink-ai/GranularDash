import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export class RealTimeMonitor {
  private static instance: RealTimeMonitor
  private activeConnections: Map<string, WebSocket> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor()
    }
    return RealTimeMonitor.instance
  }

  // Start monitoring for a user session
  async startMonitoring(sessionId: string, userId: string, filters: any = {}) {
    // Clear existing monitoring for this session
    this.stopMonitoring(sessionId)

    // Start periodic monitoring
    const interval = setInterval(async () => {
      try {
        await this.collectAndBroadcastMetrics(sessionId, userId, filters)
      } catch (error) {
        console.error("Error in monitoring interval:", error)
      }
    }, 5000) // Every 5 seconds

    this.monitoringIntervals.set(sessionId, interval)

    // Update session activity
    await sql(
      `
      UPDATE monitoring_sessions 
      SET last_activity = NOW() 
      WHERE id = $1
    `,
      [sessionId],
    )
  }

  // Stop monitoring for a session
  stopMonitoring(sessionId: string) {
    const interval = this.monitoringIntervals.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(sessionId)
    }

    // Mark session as inactive
    sql(
      `
      UPDATE monitoring_sessions 
      SET is_active = false 
      WHERE id = $1
    `,
      [sessionId],
    ).catch(console.error)
  }

  // Collect and broadcast real-time metrics
  private async collectAndBroadcastMetrics(sessionId: string, userId: string, filters: any) {
    try {
      // Get latest system metrics
      const systemMetrics = await this.getLatestSystemMetrics(filters)

      // Get latest agent metrics for user
      const agentMetrics = await this.getLatestAgentMetrics(userId, filters)

      // Get active alerts
      const alerts = await this.getActiveAlerts(userId)

      // Get system health summary
      const healthSummary = await this.getSystemHealthSummary()

      const data = {
        timestamp: new Date().toISOString(),
        system_metrics: systemMetrics,
        agent_metrics: agentMetrics,
        alerts,
        health_summary: healthSummary,
        session_id: sessionId,
      }

      // Broadcast to WebSocket connection (if implemented)
      this.broadcastToSession(sessionId, data)
    } catch (error) {
      console.error("Error collecting metrics:", error)
    }
  }

  // Get latest system metrics
  private async getLatestSystemMetrics(filters: any = {}) {
    let query = `
      SELECT 
        metric_name,
        metric_value,
        metric_unit,
        component,
        severity,
        recorded_at
      FROM system_health_metrics 
      WHERE recorded_at >= NOW() - INTERVAL '1 minute'
    `

    const params = []

    if (filters.component) {
      query += ` AND component = $${params.length + 1}`
      params.push(filters.component)
    }

    query += ` ORDER BY recorded_at DESC LIMIT 100`

    return await sql(query, params)
  }

  // Get latest agent metrics
  private async getLatestAgentMetrics(userId: string, filters: any = {}) {
    let query = `
      SELECT 
        agent_id,
        metric_type,
        metric_value,
        response_time_ms,
        success_rate,
        error_count,
        throughput_rps,
        recorded_at
      FROM agent_performance_metrics 
      WHERE user_id = $1 
        AND recorded_at >= NOW() - INTERVAL '1 minute'
    `

    const params = [userId]

    if (filters.agent) {
      query += ` AND agent_id = $${params.length + 1}`
      params.push(filters.agent)
    }

    query += ` ORDER BY recorded_at DESC LIMIT 100`

    return await sql(query, params)
  }

  // Get active alerts
  private async getActiveAlerts(userId: string) {
    return await sql(
      `
      SELECT 
        id,
        alert_type,
        severity,
        title,
        description,
        component,
        agent_id,
        status,
        triggered_at,
        alert_data
      FROM monitoring_alerts 
      WHERE status = 'active' 
        AND (user_id = $1 OR user_id IS NULL)
      ORDER BY severity DESC, triggered_at DESC
      LIMIT 20
    `,
      [userId],
    )
  }

  // Get system health summary
  private async getSystemHealthSummary() {
    const [systemHealth, agentHealth, alertCounts] = await Promise.all([
      // System component health
      sql(`
        SELECT 
          component,
          COUNT(*) as metric_count,
          AVG(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_ratio,
          AVG(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_ratio
        FROM system_health_metrics 
        WHERE recorded_at >= NOW() - INTERVAL '5 minutes'
        GROUP BY component
      `),

      // Agent health summary
      sql(`
        SELECT 
          COUNT(DISTINCT agent_id) as total_agents,
          AVG(success_rate) as avg_success_rate,
          AVG(response_time_ms) as avg_response_time,
          SUM(error_count) as total_errors
        FROM agent_performance_metrics 
        WHERE recorded_at >= NOW() - INTERVAL '5 minutes'
      `),

      // Alert counts by severity
      sql(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM monitoring_alerts 
        WHERE status = 'active'
        GROUP BY severity
      `),
    ])

    return {
      system_components: systemHealth,
      agent_summary: agentHealth[0] || {},
      alert_counts: alertCounts.reduce((acc, alert) => {
        acc[alert.severity] = alert.count
        return acc
      }, {}),
      overall_health: this.calculateOverallHealth(systemHealth, agentHealth[0], alertCounts),
    }
  }

  // Calculate overall system health score
  private calculateOverallHealth(systemHealth: any[], agentHealth: any, alertCounts: any[]) {
    let healthScore = 100

    // Deduct points for critical alerts
    const criticalAlerts = alertCounts.find((a) => a.severity === "critical")?.count || 0
    const highAlerts = alertCounts.find((a) => a.severity === "high")?.count || 0
    const mediumAlerts = alertCounts.find((a) => a.severity === "medium")?.count || 0

    healthScore -= criticalAlerts * 20
    healthScore -= highAlerts * 10
    healthScore -= mediumAlerts * 5

    // Factor in agent performance
    if (agentHealth?.avg_success_rate) {
      const successRatePenalty = (100 - agentHealth.avg_success_rate) * 0.5
      healthScore -= successRatePenalty
    }

    // Factor in response times
    if (agentHealth?.avg_response_time > 2000) {
      healthScore -= 10
    }

    return Math.max(0, Math.min(100, healthScore))
  }

  // Broadcast data to WebSocket session
  private broadcastToSession(sessionId: string, data: any) {
    const connection = this.activeConnections.get(sessionId)
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(data))
    }
  }

  // Record performance metric
  static async recordMetric(
    type: "system" | "agent",
    component: string,
    metricName: string,
    value: number,
    metadata: any = {},
    agentId?: string,
    userId?: string,
  ) {
    try {
      if (type === "system") {
        await sql(
          `
          INSERT INTO system_health_metrics (
            metric_name, metric_value, component, metadata
          ) VALUES ($1, $2, $3, $4)
        `,
          [metricName, value, component, JSON.stringify(metadata)],
        )
      } else if (type === "agent" && agentId && userId) {
        await sql(
          `
          INSERT INTO agent_performance_metrics (
            agent_id, user_id, metric_type, metric_value, response_time_ms,
            success_rate, error_count, throughput_rps, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            agentId,
            userId,
            metricName,
            value,
            metadata.response_time_ms || null,
            metadata.success_rate || null,
            metadata.error_count || 0,
            metadata.throughput_rps || null,
            JSON.stringify(metadata),
          ],
        )
      }
    } catch (error) {
      console.error("Error recording metric:", error)
    }
  }

  // Auto-resolve alerts based on rules
  static async autoResolveAlerts() {
    try {
      const resolvedAlerts = await sql(`
        UPDATE monitoring_alerts 
        SET status = 'resolved', resolved_at = NOW()
        WHERE status = 'active' 
          AND auto_resolve = true 
          AND triggered_at <= NOW() - INTERVAL '1 hour' * (
            SELECT auto_resolve_minutes FROM monitoring_rules 
            WHERE rule_name = monitoring_alerts.alert_type 
            LIMIT 1
          ) / 60
        RETURNING id, title
      `)

      return resolvedAlerts.length
    } catch (error) {
      console.error("Error auto-resolving alerts:", error)
      return 0
    }
  }

  // Clean up old monitoring data
  static async cleanupOldData() {
    try {
      const [metricsDeleted, alertsDeleted, sessionsDeleted] = await Promise.all([
        // Delete metrics older than 30 days
        sql(`
          DELETE FROM system_health_metrics 
          WHERE recorded_at < NOW() - INTERVAL '30 days'
        `),

        // Delete resolved alerts older than 7 days
        sql(`
          DELETE FROM monitoring_alerts 
          WHERE status = 'resolved' 
            AND resolved_at < NOW() - INTERVAL '7 days'
        `),

        // Delete inactive sessions older than 1 day
        sql(`
          DELETE FROM monitoring_sessions 
          WHERE is_active = false 
            AND last_activity < NOW() - INTERVAL '1 day'
        `),
      ])

      return {
        metrics_deleted: metricsDeleted.length,
        alerts_deleted: alertsDeleted.length,
        sessions_deleted: sessionsDeleted.length,
      }
    } catch (error) {
      console.error("Error cleaning up old data:", error)
      return null
    }
  }
}
