import { type NextRequest, NextResponse } from "next/server"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, email, role, organization, status } = await request.json()
    const userId = params.id

    if (!name || !email || !role || !organization) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if the user exists and belongs to the same organization
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE id = ${userId} AND organization = ${currentUser.organization}
    `

    if (existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the user
    await sql`
      UPDATE users 
      SET 
        name = ${name},
        email = ${email},
        role = ${role},
        organization = ${organization},
        updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id

    // Prevent users from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if the user exists and belongs to the same organization
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE id = ${userId} AND organization = ${currentUser.organization}
    `

    if (existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete related data first (foreign key constraints)
    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM user_permissions WHERE user_id = ${userId}`
    await sql`DELETE FROM connected_agents WHERE user_id = ${userId}`
    
    // Delete the user
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
