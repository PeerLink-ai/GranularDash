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

    const { newPriceId, prorationBehavior = "create_prorations" } = await request.json()

    if (!newPriceId) {
      return NextResponse.json({ error: "New price ID is required" }, { status: 400 })
    }

    // Get user's current subscription
    const subscriptionResult = await sql`
      SELECT stripe_subscription_id, plan_id
      FROM subscriptions 
      WHERE user_id = ${user.id} 
        AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!subscriptionResult.length) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    const currentSubscriptionId = subscriptionResult[0].stripe_subscription_id

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(currentSubscriptionId)

    // Get the new plan details
    const newPlanResult = await sql`
      SELECT id, name, amount 
      FROM subscription_plans 
      WHERE stripe_price_id = ${newPriceId}
      LIMIT 1
    `

    if (!newPlanResult.length) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    const newPlan = newPlanResult[0]

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(currentSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    })

    // Update database
    await sql`
      UPDATE subscriptions 
      SET plan_id = ${newPlan.id}, updated_at = NOW()
      WHERE stripe_subscription_id = ${currentSubscriptionId}
    `

    await sql`
      UPDATE users 
      SET subscription_plan_id = ${newPlan.id}
      WHERE id = ${user.id}
    `

    // Calculate proration amount if applicable
    let prorationAmount = 0
    if (prorationBehavior === "create_prorations") {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: updatedSubscription.customer as string,
      })
      prorationAmount = upcomingInvoice.amount_due
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      prorationAmount,
      newPlan: {
        name: newPlan.name,
        amount: newPlan.amount,
      },
    })
  } catch (error: any) {
    console.error("Error changing plan:", error)

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Invalid request", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to change plan" }, { status: 500 })
  }
}
