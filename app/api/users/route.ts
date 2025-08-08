import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession, signUpUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserBySession(sessionToken)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage users
    if (!currentUser.permissions.includes("manage_users") && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all users from the same organization
    const users = await sql`
      SELECT 
        id,
        name,
        email,
        role,
        organization,
        created_at,
        last_login,
        CASE 
          WHEN last_login IS NULL THEN 'Pending Verification'
          WHEN last_login < NOW() - INTERVAL '30 days' THEN 'Inactive'
          ELSE 'Active'
        END as status
      FROM users 
      WHERE organization = ${currentUser.organization}
      ORDER BY created_at DESC
    `

    const formattedUsers = users.map(user => ({
      ...user,
      lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      status: user.status
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await getUserBySession(sessionToken)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to manage users
    if (!currentUser.permissions.includes("manage_users") && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, email, role, organization, password } = await request.json()

    if (!name || !email || !role || !organization || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create the user
    const result = await signUpUser(email, password, name, organization, role)

    return NextResponse.json({ 
      message: "User created successfully",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        organization: result.user.organization
      }
    })
  } catch (error) {
    console.error("Create user error:", error)
    
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
