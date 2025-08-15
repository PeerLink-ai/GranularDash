import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export class AgentTrialManager {
  // Check if user can start a trial
  static async canStartTrial(userId: string, agentId: string): Promise<boolean> {
    const existingTrial = await sql(
      `
      SELECT id FROM agent_trials 
      WHERE user_id = $1 AND agent_id = $2 AND status = 'active' AND expires_at > NOW()
    `,
      [userId, agentId],
    )

    return existingTrial.length === 0
  }

  // Get trial limits for an agent
  static async getTrialLimits(userId: string, agentId: string) {
    const trial = await sql(
      `
      SELECT t.*, tp.max_requests, tp.max_tokens, tp.max_agents, tp.features
      FROM agent_trials t
      JOIN agent_trial_plans tp ON t.trial_plan_id = tp.id
      WHERE t.user_id = $1 AND t.agent_id = $2 AND t.status = 'active' AND t.expires_at > NOW()
    `,
      [userId, agentId],
    )

    if (trial.length === 0) {
      return null
    }

    const t = trial[0]
    return {
      requests: {
        used: t.requests_used,
        limit: t.max_requests,
        remaining: t.max_requests - t.requests_used,
        percentage: (t.requests_used / t.max_requests) * 100,
      },
      tokens: {
        used: t.tokens_used,
        limit: t.max_tokens,
        remaining: t.max_tokens - t.tokens_used,
        percentage: (t.tokens_used / t.max_tokens) * 100,
      },
      agents: {
        used: t.agents_connected,
        limit: t.max_agents,
        remaining: t.max_agents - t.agents_connected,
        percentage: (t.agents_connected / t.max_agents) * 100,
      },
      features: t.features,
      expires_at: t.expires_at,
      trial_id: t.id,
    }
  }

  // Record performance metrics
  static async recordMetric(trialId: string, metricType: string, value: number, unit?: string, metadata?: any) {
    await sql(
      `
      INSERT INTO agent_trial_metrics (
        trial_id, metric_type, metric_value, metric_unit, metadata
      ) VALUES ($1, $2, $3, $4, $5)
    `,
      [trialId, metricType, value, unit || "", JSON.stringify(metadata || {})],
    )
  }

  // Get trial analytics
  static async getTrialAnalytics(trialId: string) {
    const [usage, metrics, performance] = await Promise.all([
      // Usage over time
      sql(
        `
        SELECT 
          DATE_TRUNC('day', recorded_at) as date,
          usage_type,
          SUM(usage_amount) as total_usage
        FROM agent_trial_usage 
        WHERE trial_id = $1 
        GROUP BY DATE_TRUNC('day', recorded_at), usage_type
        ORDER BY date DESC
      `,
        [trialId],
      ),

      // Performance metrics
      sql(
        `
        SELECT 
          metric_type,
          AVG(metric_value) as avg_value,
          MAX(metric_value) as max_value,
          MIN(metric_value) as min_value,
          COUNT(*) as data_points
        FROM agent_trial_metrics 
        WHERE trial_id = $1 
        GROUP BY metric_type
      `,
        [trialId],
      ),

      // Overall performance
      sql(
        `
        SELECT 
          COUNT(*) as total_requests,
          AVG(CASE WHEN metric_type = 'response_time' THEN metric_value END) as avg_response_time,
          AVG(CASE WHEN metric_type = 'success_rate' THEN metric_value END) as avg_success_rate,
          SUM(CASE WHEN metric_type = 'error_count' THEN metric_value ELSE 0 END) as total_errors
        FROM agent_trial_metrics 
        WHERE trial_id = $1
      `,
        [trialId],
      ),
    ])

    return {
      usage_trends: usage,
      performance_metrics: metrics,
      overall_performance: performance[0] || {},
    }
  }

  // Expire trials automatically
  static async expireTrials() {
    const expiredTrials = await sql(`
      UPDATE agent_trials 
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active' AND expires_at <= NOW()
      RETURNING id, user_id, agent_id
    `)

    // Create notifications for expired trials
    for (const trial of expiredTrials) {
      await sql(
        `
        INSERT INTO agent_trial_notifications (
          trial_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4)
      `,
        [
          trial.id,
          "trial_expired",
          "Trial Expired",
          "Your agent trial has expired. Upgrade to continue using advanced features.",
        ],
      )
    }

    return expiredTrials.length
  }

  // Get trial conversion opportunities
  static async getConversionOpportunities() {
    return await sql(`
      SELECT 
        t.*,
        tp.name as plan_name,
        tp.pricing_after_trial,
        ROUND((t.requests_used::DECIMAL / tp.max_requests) * 100, 2) as usage_percentage,
        EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 86400 as days_active
      FROM agent_trials t
      JOIN agent_trial_plans tp ON t.trial_plan_id = tp.id
      WHERE t.status = 'active' 
        AND t.expires_at > NOW()
        AND (
          (t.requests_used::DECIMAL / tp.max_requests) > 0.7 OR
          EXTRACT(EPOCH FROM (t.expires_at - NOW())) / 86400 < 3
        )
      ORDER BY usage_percentage DESC, days_active DESC
    `)
  }
}
