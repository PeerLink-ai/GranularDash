import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get user organization from session/auth - for now using placeholder
    const organization = "demo-org"

    const notifications = await sql`
      SELECT * FROM notifications 
      WHERE organization_id = ${organization}
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => [])

    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      read: notification.read,
      createdAt: notification.created_at,
    }))

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error("Get recent notifications error:", error)
    return NextResponse.json([])
  }
}
