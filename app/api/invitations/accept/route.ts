import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find user with valid invitation token
    const user = await sql`
      SELECT id, name, email, organization
      FROM users 
      WHERE invitation_token = ${token} 
      AND invitation_expires > NOW()
      AND onboarding_completed = false
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 })
    }

    const userData = user[0]

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    const sessionToken = randomBytes(32).toString("hex")
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Update user and create session
    await sql`
      UPDATE users 
      SET 
        password_hash = ${hashedPassword},
        onboarding_completed = true,
        invitation_token = NULL,
        invitation_expires = NULL,
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = ${userData.id}
    `

    // Create session
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userData.id}, ${sessionToken}, ${sessionExpires.toISOString()})
    `

    // Set session cookie
    const response = NextResponse.json({
      message: "Account activated successfully",
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        organization: userData.organization,
      },
    })

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
