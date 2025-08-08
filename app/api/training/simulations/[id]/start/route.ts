import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from session
    const userResult = await sql`
      SELECT id, email, organization 
      FROM users 
      WHERE session_token = ${sessionToken}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userResult[0]
    const simulationId = params.id

    // Update simulation status to in_progress
    const result = await sql`
      UPDATE training_simulations 
      SET 
        status = 'in_progress',
        last_run = NOW(),
        updated_at = NOW()
      WHERE id = ${simulationId} 
      AND organization_id = ${user.organization}
      RETURNING id, name, status, last_run
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }

    // Simulate completion after a delay (in real app, this would be handled differently)
    setTimeout(async () => {
      try {
        await sql`
          UPDATE training_simulations 
          SET 
            status = 'completed',
            score = ${Math.floor(Math.random() * 20) + 80},
            completed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${simulationId}
        `
      } catch (error) {
        console.error("Failed to complete simulation:", error)
      }
    }, 5000) // Complete after 5 seconds

    return NextResponse.json({ 
      success: true,
      simulation: result[0] 
    })
  } catch (error) {
    console.error("Start simulation error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to start simulation" 
    }, { status: 500 })
  }
}
