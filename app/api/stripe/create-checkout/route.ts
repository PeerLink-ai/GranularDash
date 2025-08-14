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

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY environment variable is not set")
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    try {
      const { stripe } = await import("@/lib/stripe")
      await stripe.prices.retrieve(priceId)
    } catch (stripeError: any) {
      console.error("Stripe API error:", stripeError)
      if (stripeError.code === "resource_missing") {
        return NextResponse.json(
          {
            error: "Invalid price ID - this price doesn't exist in your Stripe account",
            details: `Price ID: ${priceId}`,
          },
          { status: 400 },
        )
      }
      if (stripeError.code === "invalid_api_key") {
        return NextResponse.json(
          {
            error: "Invalid Stripe API key - check your STRIPE_SECRET_KEY environment variable",
          },
          { status: 500 },
        )
      }
      return NextResponse.json(
        {
          error: "Stripe API error",
          details: stripeError.message,
        },
        { status: 500 },
      )
    }

    // Check if customer exists in Stripe
    let stripeCustomer
    try {
      stripeCustomer = await getStripeCustomerByEmail(user.email)
    } catch (error: any) {
      console.error("Error fetching Stripe customer:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch customer data",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!stripeCustomer) {
      try {
        // Create new Stripe customer
        stripeCustomer = await createStripeCustomer(user.email, user.name)

        // Save customer to database
        await sql`
          INSERT INTO stripe_customers (user_id, stripe_customer_id, email)
          VALUES (${user.id}, ${stripeCustomer.id}, ${user.email})
          ON CONFLICT (stripe_customer_id) DO NOTHING
        `
      } catch (error: any) {
        console.error("Error creating Stripe customer:", error)
        return NextResponse.json(
          {
            error: "Failed to create customer",
            details: error.message,
          },
          { status: 500 },
        )
      }
    }

    // Create checkout session
    let session
    try {
      session = await createCheckoutSession({
        customerId: stripeCustomer.id,
        priceId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
        trialPeriodDays,
      })
    } catch (error: any) {
      console.error("Error creating checkout session:", error)
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: error.message,
        },
        { status: 500 },
      )
    }

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
