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
    const status = searchParams.get("status")
    const includeMetrics = searchParams.get("metrics") === "true"

    let query = `
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
        EXTRACT(EPOCH FROM (t.expires_at - NOW())) / 86400 as days_remaining
      FROM agent_trials t
      JOIN agent_trial_plans tp ON t.trial_plan_id = tp.id
      WHERE t.user_id = $1
    `

    const params = [session.user.id]

    if (status) {
      query += ` AND t.status = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY t.created_at DESC`

    const trials = await sql(query, params)

    // Get metrics if requested
    if (includeMetrics && trials.length > 0) {
      const trialIds = trials.map((t) => t.id)
      const metricsQuery = `
        SELECT 
          trial_id,
          metric_type,
          AVG(metric_value) as avg_value,
          MAX(metric_value) as max_value,
          MIN(metric_value) as min_value,
          COUNT(*) as data_points
        FROM agent_trial_metrics 
        WHERE trial_id = ANY($1)
        GROUP BY trial_id, metric_type
      `

      const metrics = await sql(metricsQuery, [trialIds])

      // Attach metrics to trials
      trials.forEach((trial) => {
        trial.metrics = metrics.filter((m) => m.trial_id === trial.id)
      })
    }

    return NextResponse.json({ trials })
  } catch (error) {
    console.error("Error fetching agent trials:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agent_id, trial_plan_id } = await request.json()

    if (!agent_id || !trial_plan_id) {
      return NextResponse.json({ error: "Agent ID and trial plan ID are required" }, { status: 400 })
    }

    // Check if user already has an active trial for this agent
    const existingTrial = await sql(
      `
      SELECT id FROM agent_trials 
      WHERE user_id = $1 AND agent_id = $2 AND status = 'active' AND expires_at > NOW()
    `,
      [session.user.id, agent_id],
    )

    if (existingTrial.length > 0) {
      return NextResponse.json({ error: "Active trial already exists for this agent" }, { status: 409 })
    }

    // Get trial plan details
    const trialPlan = await sql(
      `
      SELECT * FROM agent_trial_plans WHERE id = $1 AND is_active = true
    `,
      [trial_plan_id],
    )

    if (trialPlan.length === 0) {
      return NextResponse.json({ error: "Invalid or inactive trial plan" }, { status: 400 })
    }

    const plan = trialPlan[0]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days)

    // Create new trial
    const newTrial = await sql(
      `
      INSERT INTO agent_trials (
        user_id, trial_plan_id, agent_id, expires_at, trial_data
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [
        session.user.id,
        trial_plan_id,
        agent_id,
        expiresAt.toISOString(),
        JSON.stringify({
          plan_features: plan.features,
          limits: {
            max_requests: plan.max_requests,
            max_tokens: plan.max_tokens,
            max_agents: plan.max_agents,
          },
        }),
      ],
    )

    // Create welcome notification
    await sql(
      `
      INSERT INTO agent_trial_notifications (
        trial_id, notification_type, title, message
      ) VALUES ($1, $2, $3, $4)
    `,
      [
        newTrial[0].id,
        "trial_started",
        "Trial Started Successfully",
        `Your ${plan.name} trial has started and will expire on ${expiresAt.toLocaleDateString()}.`,
      ],
    )

    return NextResponse.json({
      trial: newTrial[0],
      message: "Trial started successfully",
    })
  } catch (error) {
    console.error("Error creating agent trial:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
