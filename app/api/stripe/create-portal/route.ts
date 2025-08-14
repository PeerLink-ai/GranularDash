import { type NextRequest, NextResponse } from "next/server"
import { createBillingPortalSession } from "@/lib/stripe"
import { getUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get Stripe customer ID from database
    const customerResult = await sql`
      SELECT stripe_customer_id 
      FROM stripe_customers 
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (!customerResult.length) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 })
    }

    const stripeCustomerId = customerResult[0].stripe_customer_id

    // Create billing portal session
    const session = await createBillingPortalSession(stripeCustomerId, `${process.env.NEXT_PUBLIC_APP_URL}/billing`)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
