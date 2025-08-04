import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUser } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await sql`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at, 
        last_login,
        onboarding_completed,
        CASE 
          WHEN last_login > NOW() - INTERVAL '7 days' THEN 'active'
          WHEN onboarding_completed = false THEN 'pending'
          ELSE 'inactive'
        END as status
      FROM users 
      WHERE organization = ${user.organization}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, role } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate temporary password and invitation token
    const tempPassword = randomBytes(12).toString("hex")
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    const invitationToken = randomBytes(32).toString("hex")
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user
    const newUser = await sql`
      INSERT INTO users (
        name, 
        email, 
        role, 
        organization, 
        password_hash,
        invitation_token,
        invitation_expires,
        onboarding_completed
      )
      VALUES (
        ${name}, 
        ${email}, 
        ${role}, 
        ${user.organization}, 
        ${hashedPassword},
        ${invitationToken},
        ${invitationExpires.toISOString()},
        false
      )
      RETURNING id, name, email, role
    `

    // In a real app, you would send an email here
    // For now, we'll log the invitation details
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation?token=${invitationToken}`

    console.log(`
=== USER INVITATION EMAIL ===
To: ${email}
Subject: You're invited to join ${user.organization} on Granular

Hi ${name},

You've been invited to join ${user.organization} on Granular as a ${role}.

Click the link below to activate your account:
${invitationUrl}

Your temporary password is: ${tempPassword}
(You'll be asked to create a new password when you activate your account)

This invitation expires in 7 days.

Best regards,
The Granular Team
=============================
    `)

    return NextResponse.json({
      user: newUser[0],
      message: "User invited successfully. Check console for invitation email.",
    })
  } catch (error) {
    console.error("Error inviting user:", error)
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
  }
}
