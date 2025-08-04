import { type NextRequest, NextResponse } from "next/server"
import { signUpUser } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organization, role } = await request.json()

    if (!email || !password || !name || !organization) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const result = await signUpUser(email, password, name, organization, role)
    const { user, sessionToken } = result

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Sign up error:", error)

    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
