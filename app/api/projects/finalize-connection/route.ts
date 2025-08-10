import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureProjectsSchema, ensureProjectRelationsSchema, ensureAuditLogsSchema } from "@/lib/projects-schema"

type FinalizeBody = {
  // project
  name: string
  description?: string
  type: "github"
  repo_url: string
  pinned?: boolean
  metadata?: any
  // repo
  repo: { owner: string; repo: string; branch: string }
  // user and organization context
  user_id: string
  organization?: string
  // selected
  agents: Array<{
    name: string
    path: string
    id?: string
    provider?: string
    model?: string
    endpoint?: string
    metadata?: Record<string, any>
  }>
  policy_ids?: string[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FinalizeBody

    if (!body?.name || !body?.repo_url || body.type !== "github") {
      return NextResponse.json({ error: "Missing required fields: name, repo_url, type=github" }, { status: 400 })
    }
    if (!body.user_id) {
      return NextResponse.json({ error: "user_id is required to link agents" }, { status: 400 })
    }

    await ensureProjectsSchema()
    await ensureProjectRelationsSchema()
    await ensureAuditLogsSchema()

    const projectId = crypto.randomUUID()
    const pinned = Boolean(body.pinned)
    const metadata = {
      ...(body.metadata ?? {}),
      repo: body.repo,
      connected_at: new Date().toISOString(),
    }

    // Create or upsert project
    const projectRows = await sql`
      insert into projects (id, name, description, type, repo_url, metadata, pinned, created_at, updated_at)
      values (${projectId}, ${body.name}, ${body.description ?? null}, 'github', ${body.repo_url}, ${JSON.stringify(metadata)}::jsonb, ${pinned}, now(), now())
      on conflict (id) do nothing
      returning id, name, description, type, repo_url, metadata, pinned, created_at, updated_at;
    `
    const project = projectRows?.[0] ?? {
      id: projectId,
      name: body.name,
      description: body.description ?? null,
      type: "github",
      repo_url: body.repo_url,
      metadata,
      pinned,
    }

    // Insert agents
    const agentIds: string[] = []
    for (const a of body.agents || []) {
      const connectedId = crypto.randomUUID()
      const agentId = a.id || crypto.randomUUID()
      agentIds.push(agentId)

      await sql`
        insert into connected_agents (
          id, user_id, agent_id, name, provider, model, status, endpoint,
          connected_at, last_active, usage_requests, usage_tokens_used, usage_estimated_cost,
          api_key_encrypted, configuration, health_status, last_health_check, error_count, last_error,
          metadata, created_at, updated_at, project_id
        )
        values (
          ${connectedId},
          ${body.user_id},
          ${agentId},
          ${a.name || "agent"},
          ${a.provider ?? "unknown"},
          ${a.model ?? "default"},
          'active',
          ${a.endpoint ?? null},
          now(),
          null,
          0, 0, 0.0,
          null,
          ${JSON.stringify(a.metadata ?? {})}::jsonb,
          'healthy',
          null,
          0,
          null,
          ${JSON.stringify({ path: a.path })}::jsonb,
          now(),
          now(),
          ${projectId}
        )
        on conflict (agent_id) do nothing;
      `
    }

    // Link policies to project and agents
    const policyIds = Array.isArray(body.policy_ids) ? body.policy_ids : []
    for (const pid of policyIds) {
      await sql`
        insert into project_policies (project_id, policy_id)
        values (${projectId}, ${pid})
        on conflict do nothing;
      `
      for (const aid of agentIds) {
        await sql`
          insert into policy_agent_assignments (policy_id, agent_id, status)
          values (${pid}, ${aid}, 'active')
          on conflict do nothing;
        `
      }
    }

    // Audit logs
    const desc = `Connected GitHub project ${body.repo.owner}/${body.repo.repo}@${body.repo.branch} with ${agentIds.length} agent(s) and ${policyIds.length} policy(ies).`
    await sql`
      insert into audit_logs (user_id, organization, action, resource_type, resource_id, description, status, metadata, timestamp)
      values (
        ${body.user_id},
        ${body.organization ?? "default"},
        'connect_project',
        'project',
        ${projectId}::text,
        ${desc},
        'info',
        ${JSON.stringify({ repo: body.repo, agent_count: agentIds.length, policy_count: policyIds.length })}::jsonb,
        now()
      );
    `

    return NextResponse.json({ project, agentIds, policyIds }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
