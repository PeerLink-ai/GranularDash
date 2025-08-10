import { sql } from "@/lib/db"

// Ensures projects and related governance tables exist.
// These mirror the intent of scripts/019 and 021 with idempotent guards.
export async function ensureProjectsSchema() {
  await sql`
    create table if not exists projects (
      id uuid primary key,
      name text not null,
      description text,
      type text not null check (type in ('native', 'github', 'external')),
      repo_url text,
      metadata jsonb not null default '{}'::jsonb,
      pinned boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `
  await sql`
    create index if not exists idx_projects_pinned_created_at on projects (pinned desc, created_at desc);
  `
  await sql`
    create or replace function set_updated_at()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;
  `
  await sql`drop trigger if exists trg_projects_updated_at on projects;`
  await sql`
    create trigger trg_projects_updated_at
    before update on projects
    for each row
    execute function set_updated_at();
  `
}

export async function ensureProjectRelationsSchema() {
  // project_policies table
  await sql`
    create table if not exists project_policies (
      project_id uuid not null,
      policy_id uuid not null,
      linked_at timestamptz not null default now(),
      primary key (project_id, policy_id)
    );
  `
  await sql`create index if not exists idx_project_policies_policy on project_policies (policy_id);`

  // policy_agent_assignments table
  await sql`
    create table if not exists policy_agent_assignments (
      policy_id uuid not null,
      agent_id uuid not null,
      assigned_at timestamptz not null default now(),
      status varchar(20) not null default 'active',
      primary key (policy_id, agent_id)
    );
  `

  // Ensure connected_agents has project_id column + index (safe no-op if present)
  await sql`
    do $$
    begin
      if not exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' and table_name = 'connected_agents' and column_name = 'project_id'
      ) then
        alter table connected_agents add column project_id uuid;
        create index if not exists idx_connected_agents_project on connected_agents (project_id);
      end if;
    end $$;
  `
}

// Minimal safety net for audit logs; aligns with scripts/005 semantics (simplified)
export async function ensureAuditLogsSchema() {
  await sql`
    create extension if not exists "pgcrypto";
    create table if not exists audit_logs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      organization varchar(255) not null default 'default',
      action varchar(255) not null,
      resource_type varchar(100) not null,
      resource_id varchar(255),
      description text not null,
      status varchar(50) not null default 'info',
      ip_address text,
      user_agent text,
      metadata jsonb,
      timestamp timestamptz not null default now()
    );
  `
  await sql`create index if not exists idx_audit_logs_timestamp on audit_logs (timestamp desc);`
}
