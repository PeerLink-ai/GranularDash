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

    const { subscriptionId } = await request.json()

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

    // Pause subscription by setting pause collection
    const pausedSubscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: "keep_as_draft",
      },
    })

    // Update database
    await sql`
      UPDATE subscriptions 
      SET status = 'paused', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `

    return NextResponse.json({
      success: true,
      subscription: pausedSubscription,
    })
  } catch (error: any) {
    console.error("Error pausing subscription:", error)

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Invalid subscription", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to pause subscription" }, { status: 500 })
  }
}
