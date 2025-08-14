import { stripe } from "./stripe"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface PaymentFailureInfo {
  subscriptionId: string
  customerId: string
  invoiceId: string
  attemptCount: number
  failureReason: string
  nextRetryDate?: Date
}

export async function handlePaymentFailure(failureInfo: PaymentFailureInfo) {
  const { subscriptionId, customerId, invoiceId, attemptCount, failureReason } = failureInfo

  // Get user information
  const userResult = await sql`
    SELECT u.id, u.email, u.name
    FROM users u
    JOIN stripe_customers sc ON u.id = sc.user_id
    WHERE sc.stripe_customer_id = ${customerId}
    LIMIT 1
  `

  if (!userResult.length) {
    console.error("User not found for customer:", customerId)
    return
  }

  const user = userResult[0]

  // Record the payment failure
  await sql`
    INSERT INTO payments (
      user_id, stripe_payment_intent_id, amount, currency, status, description, metadata
    ) VALUES (
      ${user.id}, 
      ${"failed_" + invoiceId + "_" + Date.now()}, 
      0, 
      'usd', 
      'failed', 
      ${`Payment failure attempt ${attemptCount}: ${failureReason}`},
      ${JSON.stringify({ invoiceId, attemptCount, failureReason })}
    )
  `

  // Handle different failure scenarios
  if (attemptCount === 1) {
    // First failure - send gentle reminder
    await sendPaymentFailureNotification(user, "first_failure", {
      invoiceId,
      failureReason,
    })
  } else if (attemptCount === 2) {
    // Second failure - more urgent notification
    await sendPaymentFailureNotification(user, "second_failure", {
      invoiceId,
      failureReason,
    })
  } else if (attemptCount >= 3) {
    // Third failure - final warning before cancellation
    await sendPaymentFailureNotification(user, "final_warning", {
      invoiceId,
      failureReason,
    })

    // If this is the 4th attempt, cancel the subscription
    if (attemptCount >= 4) {
      await cancelSubscriptionForNonPayment(subscriptionId, user.id)
    }
  }
}

export async function sendPaymentFailureNotification(
  user: any,
  type: "first_failure" | "second_failure" | "final_warning",
  details: any,
) {
  // In a real app, you would integrate with an email service like SendGrid, Resend, etc.
  console.log(`Sending ${type} notification to ${user.email}:`, details)

  // For now, we'll just log the notification
  // You can integrate with your preferred email service here
}

export async function cancelSubscriptionForNonPayment(subscriptionId: string, userId: string) {
  try {
    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscriptionId, {
      cancellation_details: {
        comment: "Canceled due to repeated payment failures",
      },
    })

    // Update database
    await sql`
      UPDATE subscriptions 
      SET status = 'canceled', ended_at = NOW(), updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `

    await sql`
      UPDATE users 
      SET subscription_status = 'inactive', subscription_plan_id = NULL
      WHERE id = ${userId}
    `

    console.log(`Subscription ${subscriptionId} canceled for non-payment`)
  } catch (error) {
    console.error("Error canceling subscription for non-payment:", error)
  }
}

export async function calculateProration(
  currentPriceId: string,
  newPriceId: string,
  subscriptionId: string,
): Promise<number> {
  try {
    // Get upcoming invoice to see proration amount
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: subscription.customer as string,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
    })

    return upcomingInvoice.amount_due
  } catch (error) {
    console.error("Error calculating proration:", error)
    return 0
  }
}

export async function retryFailedPayment(invoiceId: string): Promise<boolean> {
  try {
    const invoice = await stripe.invoices.pay(invoiceId)
    return invoice.status === "paid"
  } catch (error) {
    console.error("Error retrying payment:", error)
    return false
  }
}
