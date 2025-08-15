import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trialId = params.id

    // Get trial details with plan information
    const trial = await sql(
      `
      SELECT 
        t.*,
        tp.name as plan_name,
        tp.description as plan_description,
        tp.max_requests,
        tp.max_tokens,
        tp.max_agents,
        tp.features,
        CASE 
          WHEN t.expires_at < NOW() THEN 'expired'
          WHEN t.status = 'active' AND t.expires_at > NOW() THEN 'active'
          ELSE t.status
        END as computed_status,
        EXTRACT(EPOCH FROM (t.expires_at - NOW())) / 86400 as days_remaining,
        ROUND((t.requests_used::DECIMAL / tp.max_requests) * 100, 2) as requests_usage_percent,
        ROUND((t.tokens_used::DECIMAL / tp.max_tokens) * 100, 2) as tokens_usage_percent
      FROM agent_trials t
      JOIN agent_trial_plans tp ON t.trial_plan_id = tp.id
      WHERE t.id = $1 AND t.user_id = $2
    `,
      [trialId, session.user.id],
    )

    if (trial.length === 0) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 })
    }

    // Get recent usage data
    const recentUsage = await sql(
      `
      SELECT 
        usage_type,
        SUM(usage_amount) as total_usage,
        COUNT(*) as usage_events,
        DATE_TRUNC('day', recorded_at) as usage_date
      FROM agent_trial_usage 
      WHERE trial_id = $1 
        AND recorded_at >= NOW() - INTERVAL '7 days'
      GROUP BY usage_type, DATE_TRUNC('day', recorded_at)
      ORDER BY usage_date DESC
    `,
      [trialId],
    )

    // Get performance metrics
    const metrics = await sql(
      `
      SELECT 
        metric_type,
        metric_value,
        metric_unit,
        recorded_at
      FROM agent_trial_metrics 
      WHERE trial_id = $1 
        AND recorded_at >= NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at DESC
      LIMIT 100
    `,
      [trialId],
    )

    // Get notifications
    const notifications = await sql(
      `
      SELECT * FROM agent_trial_notifications 
      WHERE trial_id = $1 
      ORDER BY sent_at DESC 
      LIMIT 10
    `,
      [trialId],
    )

    return NextResponse.json({
      trial: trial[0],
      usage: recentUsage,
      metrics,
      notifications,
    })
  } catch (error) {
    console.error("Error fetching trial details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trialId = params.id
    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    let updateQuery = ""
    const updateParams = [trialId, session.user.id]

    switch (action) {
      case "suspend":
        updateQuery = `
          UPDATE agent_trials 
          SET status = 'suspended', updated_at = NOW() 
          WHERE id = $1 AND user_id = $2 AND status = 'active'
          RETURNING *
        `
        break
      case "resume":
        updateQuery = `
          UPDATE agent_trials 
          SET status = 'active', updated_at = NOW() 
          WHERE id = $1 AND user_id = $2 AND status = 'suspended' AND expires_at > NOW()
          RETURNING *
        `
        break
      case "cancel":
        updateQuery = `
          UPDATE agent_trials 
          SET status = 'cancelled', updated_at = NOW() 
          WHERE id = $1 AND user_id = $2 AND status IN ('active', 'suspended')
          RETURNING *
        `
        break
      case "convert":
        updateQuery = `
          UPDATE agent_trials 
          SET status = 'converted', conversion_date = NOW(), updated_at = NOW() 
          WHERE id = $1 AND user_id = $2 AND status = 'active'
          RETURNING *
        `
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await sql(updateQuery, updateParams)

    if (result.length === 0) {
      return NextResponse.json({ error: "Trial not found or action not allowed" }, { status: 404 })
    }

    // Create notification for the action
    const actionMessages = {
      suspend: "Trial has been suspended",
      resume: "Trial has been resumed",
      cancel: "Trial has been cancelled",
      convert: "Trial has been converted to paid subscription",
    }

    await sql(
      `
      INSERT INTO agent_trial_notifications (
        trial_id, notification_type, title, message
      ) VALUES ($1, $2, $3, $4)
    `,
      [trialId, `trial_${action}`, `Trial ${action.charAt(0).toUpperCase() + action.slice(1)}`, actionMessages[action]],
    )

    return NextResponse.json({
      trial: result[0],
      message: `Trial ${action} successful`,
    })
  } catch (error) {
    console.error("Error updating trial:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
