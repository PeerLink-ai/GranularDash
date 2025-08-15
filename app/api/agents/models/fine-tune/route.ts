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

    const { agentId, baseModelId, jobName, trainingDataId, validationDataId, hyperparameters = {} } = await req.json()

    // Validate required fields
    if (!agentId || !baseModelId || !jobName) {
      return NextResponse.json(
        {
          error: "Agent ID, base model ID, and job name are required",
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

    // Verify base model exists and supports fine-tuning
    const models = await sql<any[]>`
      SELECT m.*, p.supported_features
      FROM ai_models m
      JOIN ai_model_providers p ON m.provider_id = p.id
      WHERE m.id = ${baseModelId} AND m.is_available = true
    `
    if (models.length === 0) {
      return NextResponse.json(
        {
          error: "Base model not found or not available",
        },
        { status: 404 },
      )
    }

    const baseModel = models[0]
    if (!baseModel.supported_features.includes("fine_tuning")) {
      return NextResponse.json(
        {
          error: "Base model does not support fine-tuning",
        },
        { status: 400 },
      )
    }

    // Create fine-tuning job
    const [fineTuningJob] = await sql<any[]>`
      INSERT INTO model_fine_tuning_jobs (
        agent_id,
        base_model_id,
        job_name,
        training_data_id,
        validation_data_id,
        hyperparameters,
        status,
        created_by
      ) VALUES (
        ${agentId},
        ${baseModelId},
        ${jobName},
        ${trainingDataId || null},
        ${validationDataId || null},
        ${JSON.stringify(hyperparameters)},
        'pending',
        ${user.id}
      )
      RETURNING *
    `

    // Start fine-tuning process
    await startFineTuningProcess(fineTuningJob.id, baseModel)

    // Log the fine-tuning job creation
    await addAuditLog({
      userId: user.id,
      organization: user.organization,
      action: "fine_tuning_started",
      resourceType: "fine_tuning_job",
      resourceId: fineTuningJob.id,
      details: {
        agentId,
        baseModelId,
        jobName,
        hyperparameters,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(
      {
        message: "Fine-tuning job created successfully",
        job: fineTuningJob,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create fine-tuning job error:", error)
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

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")

    let query = `
      SELECT 
        ftj.*,
        ca.name as agent_name,
        m.name as base_model_name,
        p.display_name as provider_name,
        u.name as created_by_name
      FROM model_fine_tuning_jobs ftj
      JOIN created_agents ca ON ftj.agent_id = ca.id
      JOIN ai_models m ON ftj.base_model_id = m.id
      JOIN ai_model_providers p ON m.provider_id = p.id
      LEFT JOIN users u ON ftj.created_by = u.id
      WHERE ca.user_id = $1
    `

    const params = [user.id]
    let paramIndex = 2

    if (agentId) {
      query += ` AND ftj.agent_id = $${paramIndex}`
      params.push(agentId)
      paramIndex++
    }

    if (status) {
      query += ` AND ftj.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY ftj.created_at DESC`

    const jobs = await sql<any[]>`${query}`

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Get fine-tuning jobs error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

async function startFineTuningProcess(jobId: string, baseModel: any): Promise<void> {
  try {
    // Update job status to running
    await sql`
      UPDATE model_fine_tuning_jobs 
      SET status = 'running', started_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `

    // This would integrate with the actual AI provider's fine-tuning API
    // For now, we'll simulate the process
    console.log(`Starting fine-tuning job ${jobId} with base model ${baseModel.name}`)

    // In a real implementation, this would:
    // 1. Prepare training data in the provider's required format
    // 2. Upload training data to the provider
    // 3. Start the fine-tuning job via provider API
    // 4. Poll for job status updates
    // 5. Update the database with progress and results
  } catch (error) {
    console.error(`Error starting fine-tuning job ${jobId}:`, error)

    // Update job status to failed
    await sql`
      UPDATE model_fine_tuning_jobs 
      SET 
        status = 'failed', 
        error_message = ${String(error)},
        updated_at = NOW()
      WHERE id = ${jobId}
    `
  }
}
