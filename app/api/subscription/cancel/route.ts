import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subscriptionId, reason, feedback } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    // Verify user owns this subscription
    const subscriptionResult = await sql`
      SELECT id FROM subscriptions 
      WHERE user_id = ${user.id} AND stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `

    if (!subscriptionResult.length) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Cancel subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: reason ? `Reason: ${reason}. Feedback: ${feedback}` : undefined,
      },
    })

    // Log cancellation feedback
    if (reason || feedback) {
      await sql`
        INSERT INTO audit_logs (
          user_id, organization, action, resource_type, resource_id, details
        ) VALUES (
          ${user.id}, ${user.organization || "default"}, 'subscription_canceled', 
          'subscription', ${subscriptionId},
          ${JSON.stringify({ reason, feedback, canceledAt: new Date().toISOString() })}
        )
      `
    }

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription,
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error("Error canceling subscription:", error)

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Invalid subscription", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
