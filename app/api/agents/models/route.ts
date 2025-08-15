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
    const providerType = searchParams.get("provider")
    const modelType = searchParams.get("type")
    const agentId = searchParams.get("agentId")

    // Get available models with provider information
    let query = `
      SELECT 
        m.*,
        p.name as provider_name,
        p.display_name as provider_display_name,
        p.provider_type,
        p.supported_features,
        p.rate_limits,
        p.pricing
      FROM ai_models m
      JOIN ai_model_providers p ON m.provider_id = p.id
      WHERE m.is_available = true AND p.is_active = true
    `

    const params: any[] = []
    let paramIndex = 1

    if (providerType) {
      query += ` AND p.provider_type = $${paramIndex}`
      params.push(providerType)
      paramIndex++
    }

    if (modelType) {
      query += ` AND m.model_type = $${paramIndex}`
      params.push(modelType)
      paramIndex++
    }

    query += ` ORDER BY p.provider_type, m.name`

    const models = await sql<any[]>`${query}`

    // If agentId is provided, also get current model configuration
    let currentConfig = null
    if (agentId) {
      const configs = await sql<any[]>`
        SELECT amc.*, m.name as model_name, p.display_name as provider_name
        FROM agent_model_configs amc
        JOIN ai_models m ON amc.model_id = m.id
        JOIN ai_model_providers p ON m.provider_id = p.id
        WHERE amc.agent_id = ${agentId} AND amc.is_primary = true AND amc.is_active = true
      `
      currentConfig = configs[0] || null
    }

    // Group models by provider
    const groupedModels = models.reduce(
      (acc, model) => {
        const providerKey = model.provider_type
        if (!acc[providerKey]) {
          acc[providerKey] = {
            provider: {
              name: model.provider_name,
              display_name: model.provider_display_name,
              type: model.provider_type,
              supported_features: model.supported_features,
              rate_limits: model.rate_limits,
              pricing: model.pricing,
            },
            models: [],
          }
        }
        acc[providerKey].models.push({
          id: model.id,
          model_id: model.model_id,
          name: model.name,
          description: model.description,
          model_type: model.model_type,
          capabilities: model.capabilities,
          context_length: model.context_length,
          max_tokens: model.max_tokens,
          input_cost_per_token: model.input_cost_per_token,
          output_cost_per_token: model.output_cost_per_token,
          parameters: model.parameters,
          performance_metrics: model.performance_metrics,
        })
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json({
      models,
      grouped: groupedModels,
      currentConfig,
    })
  } catch (error) {
    console.error("Get AI models error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

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

    const { agentId, modelId, configuration, systemPrompt, isPrimary = true } = await req.json()

    // Validate required fields
    if (!agentId || !modelId) {
      return NextResponse.json(
        {
          error: "Agent ID and model ID are required",
        },
        { status: 400 },
      )
    }

    // Verify agent exists and belongs to user
    const agents = await sql<any[]>`
      SELECT id FROM created_agents WHERE id = ${agentId} AND user_id = ${user.id}
    `
    if (agents.length === 0) {
      return NextResponse.json(
        {
          error: "Agent not found or access denied",
        },
        { status: 404 },
      )
    }

    // Verify model exists
    const models = await sql<any[]>`
      SELECT id FROM ai_models WHERE id = ${modelId} AND is_available = true
    `
    if (models.length === 0) {
      return NextResponse.json(
        {
          error: "Model not found or not available",
        },
        { status: 404 },
      )
    }

    // If this is set as primary, deactivate other primary configs
    if (isPrimary) {
      await sql`
        UPDATE agent_model_configs 
        SET is_primary = false, updated_at = NOW()
        WHERE agent_id = ${agentId}
      `
    }

    // Create model configuration
    const [modelConfig] = await sql<any[]>`
      INSERT INTO agent_model_configs (
        agent_id,
        model_id,
        configuration,
        system_prompt,
        is_primary,
        is_active
      ) VALUES (
        ${agentId},
        ${modelId},
        ${JSON.stringify(configuration || {})},
        ${systemPrompt || ""},
        ${isPrimary},
        true
      )
      RETURNING *
    `

    return NextResponse.json(
      {
        message: "Model configuration created successfully",
        config: modelConfig,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create model configuration error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
