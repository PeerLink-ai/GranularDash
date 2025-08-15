import { NextResponse, type NextRequest } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value || request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current subscription
    const subscriptionResult = await sql`
      SELECT 
        s.*,
        sp.name as plan_name,
        sp.amount as plan_amount,
        sp.features as plan_features
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = ${user.id} 
        AND s.status IN ('active', 'trialing', 'past_due')
      ORDER BY s.created_at DESC
      LIMIT 1
    `

    const subscription = subscriptionResult[0] || null

    // Get user's billing info
    const userResult = await sql`
      SELECT subscription_status, trial_ends_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `

    const userBilling = userResult[0] || { subscription_status: "inactive", trial_ends_at: null }

    return NextResponse.json({
      subscription,
      status: userBilling.subscription_status,
      trialEndsAt: userBilling.trial_ends_at,
    })
  } catch (error) {
    console.error("Error fetching user subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
