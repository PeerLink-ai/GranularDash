import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const plans = await sql`
      SELECT 
        id,
        name,
        description,
        stripe_price_id,
        stripe_product_id,
        amount,
        currency,
        interval,
        interval_count,
        trial_period_days,
        features,
        is_active
      FROM subscription_plans 
      WHERE is_active = true
      ORDER BY amount ASC
    `

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
