import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
})

export const getStripeCustomerByEmail = async (email: string) => {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })
  return customers.data[0] || null
}

export const createStripeCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "dashboard_app",
    },
  })
}

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriodDays,
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  trialPeriodDays?: number
}) => {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "required",
  }

  if (trialPeriodDays && trialPeriodDays > 0) {
    sessionParams.subscription_data = {
      trial_period_days: trialPeriodDays,
    }
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

export const createBillingPortalSession = async (customerId: string, returnUrl: string) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export const cancelSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export const updateSubscription = async (subscriptionId: string, priceId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: "create_prorations",
  })
}
