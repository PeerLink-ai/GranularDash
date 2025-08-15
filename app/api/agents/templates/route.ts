import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserBySession(sessionToken)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    let query = `
      SELECT 
        id,
        name,
        description,
        category,
        template_config,
        capabilities,
        required_integrations,
        created_at
      FROM agent_templates 
      WHERE is_active = true
    `

    const params: any[] = []
    if (category) {
      query += ` AND category = $1`
      params.push(category)
    }

    query += ` ORDER BY category, name`

    const templates = await sql<any[]>`${query}`

    // Group by category
    const groupedTemplates = templates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = []
        }
        acc[template.category].push(template)
        return acc
      },
      {} as Record<string, any[]>,
    )

    return NextResponse.json({
      templates: templates,
      grouped: groupedTemplates,
    })
  } catch (error) {
    console.error("Get agent templates error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
