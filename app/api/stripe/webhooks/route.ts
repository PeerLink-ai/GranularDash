import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { neon } from "@neondatabase/serverless"
import { handlePaymentFailure } from "@/lib/payment-utils"
import type Stripe from "stripe"

const sql = neon(process.env.DATABASE_URL!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Check if we've already processed this event
    const existingEvent = await sql`
      SELECT id FROM stripe_webhook_events 
      WHERE stripe_event_id = ${event.id}
      LIMIT 1
    `

    if (existingEvent.length > 0) {
      return NextResponse.json({ received: true })
    }

    // Store the event
    await sql`
      INSERT INTO stripe_webhook_events (stripe_event_id, event_type, data)
      VALUES (${event.id}, ${event.type}, ${JSON.stringify(event.data)})
    `

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_action_required":
        await handlePaymentActionRequired(event.data.object as Stripe.Invoice)
        break

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case "invoice.upcoming":
        await handleUpcomingInvoice(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await sql`
      UPDATE stripe_webhook_events 
      SET processed = true 
      WHERE stripe_event_id = ${event.id}
    `

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Get user from stripe customer
  const customerResult = await sql`
    SELECT user_id FROM stripe_customers 
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!customerResult.length) {
    console.error("User not found for Stripe customer:", customerId)
    return
  }

  const userId = customerResult[0].user_id

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price.id
  const planResult = await sql`
    SELECT id FROM subscription_plans 
    WHERE stripe_price_id = ${priceId}
    LIMIT 1
  `

  if (!planResult.length) {
    console.error("Plan not found for price ID:", priceId)
    return
  }

  const planId = planResult[0].id

  // Upsert subscription
  await sql`
    INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id, plan_id, status,
      current_period_start, current_period_end, trial_start, trial_end
    ) VALUES (
      ${userId}, ${subscription.id}, ${customerId}, ${planId}, ${subscription.status},
      ${new Date(subscription.current_period_start * 1000).toISOString()},
      ${new Date(subscription.current_period_end * 1000).toISOString()},
      ${subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null},
      ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `

  // Update user subscription status
  await sql`
    UPDATE users 
    SET subscription_status = ${subscription.status}, subscription_plan_id = ${planId}
    WHERE id = ${userId}
  `
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const customerResult = await sql`
    SELECT user_id FROM stripe_customers 
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!customerResult.length) return

  const userId = customerResult[0].user_id

  // Update subscription status
  await sql`
    UPDATE subscriptions 
    SET status = 'canceled', ended_at = NOW(), updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
  `

  // Update user status
  await sql`
    UPDATE users 
    SET subscription_status = 'inactive', subscription_plan_id = NULL
    WHERE id = ${userId}
  `
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customerId = subscription.customer as string

  const customerResult = await sql`
    SELECT user_id FROM stripe_customers 
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!customerResult.length) return

  const userId = customerResult[0].user_id

  // Record payment
  await sql`
    INSERT INTO payments (
      user_id, stripe_payment_intent_id, amount, currency, status, description
    ) VALUES (
      ${userId}, ${invoice.payment_intent as string}, ${invoice.amount_paid}, 
      ${invoice.currency}, 'succeeded', ${invoice.description || "Subscription payment"}
    )
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  `
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customerId = subscription.customer as string

  // Get attempt count from invoice
  const attemptCount = invoice.attempt_count || 1

  await handlePaymentFailure({
    subscriptionId: subscription.id,
    customerId,
    invoiceId: invoice.id,
    attemptCount,
    failureReason: invoice.last_finalization_error?.message || "Payment failed",
  })

  const customerResult = await sql`
    SELECT user_id FROM stripe_customers 
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!customerResult.length) return

  const userId = customerResult[0].user_id

  // Record failed payment
  await sql`
    INSERT INTO payments (
      user_id, stripe_payment_intent_id, amount, currency, status, description, metadata
    ) VALUES (
      ${userId}, ${(invoice.payment_intent as string) || "failed_" + Date.now()}, 
      ${invoice.amount_due}, ${invoice.currency}, 'failed', 
      ${invoice.description || "Failed subscription payment"},
      ${JSON.stringify({ attemptCount, invoiceId: invoice.id })}
    )
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  `
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log("Payment action required for invoice:", invoice.id)
  // Handle 3D Secure or other authentication requirements
  // You might want to send an email to the customer here
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const customerResult = await sql`
    SELECT user_id FROM stripe_customers 
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!customerResult.length) return

  console.log("Trial ending soon for subscription:", subscription.id)
  // Send trial ending notification to user
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  console.log("Upcoming invoice for customer:", invoice.customer)
  // Send upcoming payment notification
}
