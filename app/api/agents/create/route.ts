import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { addAuditLog } from "@/lib/audit-store"

export async function POST(req: NextRequest) {
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

    const {
      name,
      description,
      templateId,
      agentType,
      configuration,
      capabilities,
      repositoryUrl,
      repositoryType = "github",
      branch = "main",
    } = await req.json()

    // Validate required fields
    if (!name || !agentType) {
      return NextResponse.json(
        {
          error: "Name and agent type are required",
        },
        { status: 400 },
      )
    }

    // Get template if specified
    let template = null
    if (templateId) {
      const templates = await sql<any[]>`
        SELECT * FROM agent_templates WHERE id = ${templateId} AND is_active = true
      `
      template = templates[0]
      if (!template) {
        return NextResponse.json(
          {
            error: "Invalid template ID",
          },
          { status: 400 },
        )
      }
    }

    // Create the agent
    const agentConfig = {
      ...template?.template_config,
      ...configuration,
    }

    const agentCapabilities = capabilities || template?.capabilities || []

    const [createdAgent] = await sql<any[]>`
      INSERT INTO created_agents (
        user_id,
        organization_id,
        template_id,
        name,
        description,
        agent_type,
        configuration,
        capabilities,
        source_code,
        status
      ) VALUES (
        ${user.id},
        ${user.organization_id || null},
        ${templateId || null},
        ${name},
        ${description || ""},
        ${agentType},
        ${JSON.stringify(agentConfig)},
        ${JSON.stringify(agentCapabilities)},
        ${template?.code_template || "// Custom agent implementation"},
        'draft'
      )
      RETURNING *
    `

    // Add repository connection if provided
    if (repositoryUrl) {
      await sql`
        INSERT INTO agent_repositories (
          agent_id,
          repository_url,
          repository_type,
          branch,
          sync_status
        ) VALUES (
          ${createdAgent.id},
          ${repositoryUrl},
          ${repositoryType},
          ${branch},
          'pending'
        )
      `
    }

    // Log the creation
    await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: "agent_created",
      resourceType: "created_agent",
      resourceId: createdAgent.id,
      details: {
        name,
        agentType,
        templateId,
        hasRepository: !!repositoryUrl,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(
      {
        message: "Agent created successfully",
        agent: createdAgent,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Agent creation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

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

    // Get user's created agents
    const agents = await sql<any[]>`
      SELECT 
        ca.*,
        at.name as template_name,
        at.category as template_category,
        COUNT(ar.id) as repository_count,
        COUNT(ad.id) as deployment_count
      FROM created_agents ca
      LEFT JOIN agent_templates at ON ca.template_id = at.id
      LEFT JOIN agent_repositories ar ON ca.id = ar.agent_id
      LEFT JOIN agent_deployments ad ON ca.id = ad.agent_id AND ad.status = 'active'
      WHERE ca.user_id = ${user.id}
      GROUP BY ca.id, at.name, at.category
      ORDER BY ca.created_at DESC
    `

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Get created agents error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
