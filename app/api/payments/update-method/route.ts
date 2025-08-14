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

    const { paymentMethodId, setAsDefault } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 })
    }

    // Get user's Stripe customer ID
    const customerResult = await sql`
      SELECT stripe_customer_id 
      FROM stripe_customers 
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (!customerResult.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const customerId = customerResult[0].stripe_customer_id

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Update all active subscriptions to use this payment method
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      })

      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.update(subscription.id, {
          default_payment_method: paymentMethodId,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating payment method:", error)

    if (error.type === "StripeCardError") {
      return NextResponse.json({ error: "Invalid payment method", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
  }
}
