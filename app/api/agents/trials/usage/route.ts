import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agent_id, usage_type, usage_amount = 1, metadata = {} } = await request.json()

    if (!agent_id || !usage_type) {
      return NextResponse.json({ error: "Agent ID and usage type are required" }, { status: 400 })
    }

    // Find active trial for this agent
    const activeTrial = await sql(
      `
      SELECT t.*, tp.max_requests, tp.max_tokens, tp.max_agents
      FROM agent_trials t
      JOIN agent_trial_plans tp ON t.trial_plan_id = tp.id
      WHERE t.user_id = $1 AND t.agent_id = $2 AND t.status = 'active' AND t.expires_at > NOW()
    `,
      [session.user.id, agent_id],
    )

    if (activeTrial.length === 0) {
      return NextResponse.json({ error: "No active trial found for this agent" }, { status: 404 })
    }

    const trial = activeTrial[0]

    // Check usage limits
    let limitExceeded = false
    let limitMessage = ""

    switch (usage_type) {
      case "request":
        if (trial.requests_used + usage_amount > trial.max_requests) {
          limitExceeded = true
          limitMessage = "Request limit exceeded"
        }
        break
      case "token":
        if (trial.tokens_used + usage_amount > trial.max_tokens) {
          limitExceeded = true
          limitMessage = "Token limit exceeded"
        }
        break
      case "connection":
        if (trial.agents_connected + usage_amount > trial.max_agents) {
          limitExceeded = true
          limitMessage = "Agent connection limit exceeded"
        }
        break
    }

    if (limitExceeded) {
      // Create notification about limit exceeded
      await sql(
        `
        INSERT INTO agent_trial_notifications (
          trial_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4)
      `,
        [trial.id, "limit_exceeded", "Usage Limit Exceeded", limitMessage],
      )

      return NextResponse.json(
        {
          error: limitMessage,
          usage_blocked: true,
          current_usage: {
            requests: trial.requests_used,
            tokens: trial.tokens_used,
            agents: trial.agents_connected,
          },
          limits: {
            requests: trial.max_requests,
            tokens: trial.max_tokens,
            agents: trial.max_agents,
          },
        },
        { status: 429 },
      )
    }

    // Record usage
    await sql(
      `
      INSERT INTO agent_trial_usage (
        trial_id, agent_id, usage_type, usage_amount, usage_metadata
      ) VALUES ($1, $2, $3, $4, $5)
    `,
      [trial.id, agent_id, usage_type, usage_amount, JSON.stringify(metadata)],
    )

    // Update trial counters
    let updateQuery = "UPDATE agent_trials SET last_activity = NOW()"
    const updateParams = [trial.id]

    switch (usage_type) {
      case "request":
        updateQuery += ", requests_used = requests_used + $2"
        updateParams.push(usage_amount)
        break
      case "token":
        updateQuery += ", tokens_used = tokens_used + $2"
        updateParams.push(usage_amount)
        break
      case "connection":
        updateQuery += ", agents_connected = agents_connected + $2"
        updateParams.push(usage_amount)
        break
    }

    updateQuery += " WHERE id = $1 RETURNING *"
    const updatedTrial = await sql(updateQuery, updateParams)

    // Check if approaching limits and send notifications
    const updatedTrialData = updatedTrial[0]
    const requestsPercent = (updatedTrialData.requests_used / trial.max_requests) * 100
    const tokensPercent = (updatedTrialData.tokens_used / trial.max_tokens) * 100

    if (requestsPercent >= 80 || tokensPercent >= 80) {
      await sql(
        `
        INSERT INTO agent_trial_notifications (
          trial_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4)
      `,
        [
          trial.id,
          "usage_warning",
          "Usage Warning",
          `You have used ${Math.max(requestsPercent, tokensPercent).toFixed(1)}% of your trial limits.`,
        ],
      )
    }

    return NextResponse.json({
      usage_recorded: true,
      current_usage: {
        requests: updatedTrialData.requests_used,
        tokens: updatedTrialData.tokens_used,
        agents: updatedTrialData.agents_connected,
      },
      usage_percentages: {
        requests: requestsPercent,
        tokens: tokensPercent,
        agents: (updatedTrialData.agents_connected / trial.max_agents) * 100,
      },
    })
  } catch (error) {
    console.error("Error recording trial usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
