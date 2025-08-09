-- Ensure policy ↔ project relations and agent assignment linking.
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create project_policies relation
CREATE TABLE IF NOT EXISTS project_policies (
  project_id UUID NOT NULL,
  policy_id UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, policy_id)
);

-- Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_project_policies_policy ON project_policies (policy_id);

-- Create policy_agent_assignments if missing
CREATE TABLE IF NOT EXISTS policy_agent_assignments (
  policy_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (policy_id, agent_id)
);

-- Add project_id to connected_agents when absent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'connected_agents' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE connected_agents ADD COLUMN project_id UUID;
    CREATE INDEX IF NOT EXISTS idx_connected_agents_project ON connected_agents (project_id);
  END IF;
END $$;
