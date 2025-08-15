import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const severity = searchParams.get("severity")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const includeAcknowledged = searchParams.get("acknowledged") === "true"

    let query = `
      SELECT 
        i.*,
        CASE 
          WHEN i.expires_at IS NOT NULL AND i.expires_at < NOW() THEN true
          ELSE false
        END as is_expired
      FROM analytics_insights i
      WHERE (i.user_id = $1 OR i.user_id IS NULL)
    `

    const params = [session.user.id]

    if (category) {
      query += ` AND i.category = $${params.length + 1}`
      params.push(category)
    }

    if (severity) {
      query += ` AND i.severity = $${params.length + 1}`
      params.push(severity)
    }

    if (!includeAcknowledged) {
      query += ` AND i.is_acknowledged = false`
    }

    query += ` ORDER BY 
      CASE i.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
        ELSE 5 
      END,
      i.confidence_score DESC,
      i.created_at DESC
      LIMIT $${params.length + 1}
    `

    params.push(limit)

    const insights = await sql(query, params)

    // Get insight categories summary
    const categorySummary = await sql(
      `
      SELECT 
        category,
        COUNT(*) as total_count,
        COUNT(CASE WHEN is_acknowledged = false THEN 1 END) as unacknowledged_count,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count
      FROM analytics_insights 
      WHERE (user_id = $1 OR user_id IS NULL)
        AND (expires_at IS NULL OR expires_at > NOW())
      GROUP BY category
      ORDER BY critical_count DESC, high_count DESC
    `,
      [session.user.id],
    )

    return NextResponse.json({
      insights,
      category_summary: categorySummary,
      total_count: insights.length,
    })
  } catch (error) {
    console.error("Error fetching analytics insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, insight_ids } = await request.json()

    if (!action || !insight_ids || !Array.isArray(insight_ids)) {
      return NextResponse.json({ error: "Action and insight IDs are required" }, { status: 400 })
    }

    let result = []

    switch (action) {
      case "acknowledge":
        result = await sql(
          `
          UPDATE analytics_insights 
          SET is_acknowledged = true, acknowledged_at = NOW()
          WHERE id = ANY($1) AND (user_id = $2 OR user_id IS NULL)
          RETURNING id, title
        `,
          [insight_ids, session.user.id],
        )
        break

      case "dismiss":
        result = await sql(
          `
          UPDATE analytics_insights 
          SET expires_at = NOW()
          WHERE id = ANY($1) AND (user_id = $2 OR user_id IS NULL)
          RETURNING id, title
        `,
          [insight_ids, session.user.id],
        )
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      message: `${action} completed successfully`,
      affected_count: result.length,
      insights: result,
    })
  } catch (error) {
    console.error("Error updating insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
