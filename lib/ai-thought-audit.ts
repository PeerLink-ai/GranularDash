import { sql } from "@/lib/db"

export interface AIThoughtProcessLog {
  id: number
  agent_id: string
  session_id?: string
  thought_type: "reasoning" | "decision" | "analysis" | "planning" | "reflection"
  prompt?: string
  thought_content: string
  context_data?: Record<string, any>
  confidence_score?: number
  reasoning_steps?: string[]
  decision_factors?: Record<string, any>
  alternatives_considered?: Record<string, any>
  outcome_prediction?: string
  actual_outcome?: string
  processing_time_ms?: number
  model_used?: string
  temperature?: number
  tokens_used?: number
  audit_block_hash?: string
  created_at: string
  updated_at: string
}

export interface CreateAIThoughtLogInput {
  agentId: string
  sessionId?: string
  thoughtType: AIThoughtProcessLog["thought_type"]
  prompt?: string
  thoughtContent: string
  contextData?: Record<string, any>
  confidenceScore?: number
  reasoningSteps?: string[]
  decisionFactors?: Record<string, any>
  alternativesConsidered?: Record<string, any>
  outcomePrediction?: string
  processingTimeMs?: number
  modelUsed?: string
  temperature?: number
  tokensUsed?: number
}

let thoughtTableEnsured = false

async function ensureAIThoughtTable() {
  if (thoughtTableEnsured) return

  await sql`
    CREATE TABLE IF NOT EXISTS ai_thought_process_logs (
      id SERIAL PRIMARY KEY,
      agent_id VARCHAR(255) NOT NULL,
      session_id VARCHAR(255),
      thought_type VARCHAR(50) NOT NULL,
      prompt TEXT,
      thought_content TEXT NOT NULL,
      context_data JSONB,
      confidence_score DECIMAL(3,2),
      reasoning_steps JSONB,
      decision_factors JSONB,
      alternatives_considered JSONB,
      outcome_prediction TEXT,
      actual_outcome TEXT,
      processing_time_ms INTEGER,
      model_used VARCHAR(100),
      temperature DECIMAL(3,2),
      tokens_used INTEGER,
      audit_block_hash VARCHAR(64),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_agent_id ON ai_thought_process_logs(agent_id);
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_session_id ON ai_thought_process_logs(session_id);
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_created_at ON ai_thought_process_logs(created_at DESC);
  `

  thoughtTableEnsured = true
}

export async function addAIThoughtLog(input: CreateAIThoughtLogInput): Promise<AIThoughtProcessLog> {
  await ensureAIThoughtTable()

  const {
    agentId,
    sessionId,
    thoughtType,
    prompt,
    thoughtContent,
    contextData,
    confidenceScore,
    reasoningSteps,
    decisionFactors,
    alternativesConsidered,
    outcomePrediction,
    processingTimeMs,
    modelUsed,
    temperature,
    tokensUsed,
  } = input

  // Generate a simple hash for audit trail
  const auditHash = generateSimpleHash(agentId + thoughtContent + Date.now())

  const rows = await sql<AIThoughtProcessLog[]>`
    INSERT INTO ai_thought_process_logs (
      agent_id, session_id, thought_type, prompt, thought_content,
      context_data, confidence_score, reasoning_steps, decision_factors,
      alternatives_considered, outcome_prediction, processing_time_ms,
      model_used, temperature, tokens_used, audit_block_hash
    ) VALUES (
      ${agentId}, ${sessionId}, ${thoughtType}, ${prompt}, ${thoughtContent},
      ${sql.json(contextData || {})}, ${confidenceScore}, ${sql.json(reasoningSteps || [])},
      ${sql.json(decisionFactors || {})}, ${sql.json(alternativesConsidered || {})},
      ${outcomePrediction}, ${processingTimeMs}, ${modelUsed}, ${temperature},
      ${tokensUsed}, ${auditHash}
    )
    RETURNING *
  `

  return rows[0]
}

export async function listAIThoughtLogs(params: {
  agentId?: string
  sessionId?: string
  thoughtType?: string
  limit?: number
  offset?: number
}) {
  await ensureAIThoughtTable()

  const { agentId, sessionId, thoughtType, limit = 50, offset = 0 } = params

  let query = sql`SELECT * FROM ai_thought_process_logs WHERE 1=1`

  if (agentId) {
    query = sql`${query} AND agent_id = ${agentId}`
  }

  if (sessionId) {
    query = sql`${query} AND session_id = ${sessionId}`
  }

  if (thoughtType) {
    query = sql`${query} AND thought_type = ${thoughtType}`
  }

  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const rows = await sql<AIThoughtProcessLog[]>`${query}`
  return rows
}

export async function updateThoughtOutcome(thoughtId: number, actualOutcome: string) {
  await ensureAIThoughtTable()

  await sql`
    UPDATE ai_thought_process_logs 
    SET actual_outcome = ${actualOutcome}, updated_at = NOW()
    WHERE id = ${thoughtId}
  `
}

function generateSimpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}
