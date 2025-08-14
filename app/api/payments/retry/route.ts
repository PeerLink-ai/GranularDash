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
      SELECT stripe_subscription_id 
      FROM subscriptions 
      WHERE user_id = ${user.id} AND stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `

    if (!subscriptionResult.length) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Get the latest invoice for this subscription
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 1,
      status: "open",
    })

    if (!invoices.data.length) {
      return NextResponse.json({ error: "No unpaid invoices found" }, { status: 404 })
    }

    const invoice = invoices.data[0]

    // Attempt to pay the invoice
    const paidInvoice = await stripe.invoices.pay(invoice.id)

    // Update payment record
    await sql`
      UPDATE payments 
      SET status = ${paidInvoice.status === "paid" ? "succeeded" : "failed"}
      WHERE stripe_payment_intent_id = ${paidInvoice.payment_intent as string}
    `

    return NextResponse.json({
      success: paidInvoice.status === "paid",
      status: paidInvoice.status,
      invoiceId: paidInvoice.id,
    })
  } catch (error: any) {
    console.error("Error retrying payment:", error)

    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return NextResponse.json({ error: "Payment failed", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to retry payment" }, { status: 500 })
  }
}
