import { type NextRequest, NextResponse } from "next/server"
import { createStripeCustomer, getStripeCustomerByEmail, createCheckoutSession } from "@/lib/stripe"
import { getUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Creating checkout session...")

    const user = await getUser()
    if (!user) {
      console.error("No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User found:", user.email)

    const { priceId, trialPeriodDays } = await request.json()
    console.log("Request data:", { priceId, trialPeriodDays })

    if (!priceId) {
      console.error("No priceId provided")
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured")
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL not configured")
      return NextResponse.json({ error: "App URL not configured" }, { status: 500 })
    }

    console.log("Checking for existing Stripe customer...")
    let stripeCustomer = await getStripeCustomerByEmail(user.email)

    if (!stripeCustomer) {
      console.log("Creating new Stripe customer...")
      stripeCustomer = await createStripeCustomer(user.email, user.name)
      console.log("Created Stripe customer:", stripeCustomer.id)

      await sql`
        INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
        VALUES (${user.id}, ${stripeCustomer.id}, ${user.email})
        ON CONFLICT (stripe_customer_id) DO NOTHING
      `
      console.log("Saved customer to database")
    } else {
      console.log("Found existing Stripe customer:", stripeCustomer.id)
    }

    console.log("Creating checkout session with params:", {
      customerId: stripeCustomer.id,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
      trialPeriodDays,
    })

    const session = await createCheckoutSession({
      customerId: stripeCustomer.id,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
      trialPeriodDays,
    })

    console.log("Checkout session created successfully:", session.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Detailed error creating checkout session:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })

    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session"
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
