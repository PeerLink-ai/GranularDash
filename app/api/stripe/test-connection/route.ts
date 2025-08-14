import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function GET() {
  try {
    // Test basic Stripe connection
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      message: "Stripe connection successful",
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        details_submitted: account.details_submitted,
      },
    })
  } catch (error: any) {
    console.error("Stripe connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        type: error.type,
      },
      { status: 500 },
    )
  }
}
