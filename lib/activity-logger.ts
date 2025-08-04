import { sql } from "@/lib/db"

interface ActivityLogData {
  userId: string
  organization: string
  action: string
  resourceType: string
  resourceId?: string
  description: string
  status: "success" | "warning" | "error" | "info"
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export async function logActivity(data: ActivityLogData) {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id,
        organization,
        action,
        resource_type,
        resource_id,
        description,
        status,
        ip_address,
        user_agent,
        metadata,
        timestamp
      ) VALUES (
        ${data.userId},
        ${data.organization},
        ${data.action},
        ${data.resourceType},
        ${data.resourceId || null},
        ${data.description},
        ${data.status},
        ${data.ipAddress || null},
        ${data.userAgent || null},
        ${data.metadata ? JSON.stringify(data.metadata) : null},
        NOW()
      )
    `
  } catch (error) {
    console.error("Failed to log activity:", error)
    // Don't throw error to avoid breaking the main operation
  }
}
