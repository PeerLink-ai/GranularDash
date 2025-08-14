import { type NextRequest, NextResponse } from "next/server"
import { createStripeCustomer, getStripeCustomerByEmail, createCheckoutSession } from "@/lib/stripe"
import { getUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { priceId, trialPeriodDays } = body

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    if (!priceId.startsWith("price_")) {
      return NextResponse.json({ error: "Invalid price ID format" }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Check if customer exists in Stripe
    let stripeCustomer = await getStripeCustomerByEmail(user.email)

    if (!stripeCustomer) {
      // Create new Stripe customer
      stripeCustomer = await createStripeCustomer(user.email, user.name)

      // Save customer to database
      await sql`
        INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
        VALUES (${user.id}, ${stripeCustomer.id}, ${user.email})
        ON CONFLICT (stripe_customer_id) DO NOTHING
      `
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: stripeCustomer.id,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
      trialPeriodDays,
    })

    if (!session || !session.url) {
      throw new Error("Failed to create checkout session - no URL returned")
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      success: true,
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}
