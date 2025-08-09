-- Normalize policy schema and seed sample data for metrics to work reliably

-- Enable extensions for UUIDs if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create governance_policies table if missing
CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'policy',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | inactive | draft
  organization_id VARCHAR(255),                   -- tenant or org scoping
  applies_to_agents BOOLEAN DEFAULT FALSE,
  agent_enforcement VARCHAR(20) DEFAULT 'warn',   -- warn | block | audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_governance_policies_org ON governance_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_governance_policies_updated ON governance_policies(updated_at DESC);

-- Create policy_violations table if missing
CREATE TABLE IF NOT EXISTS policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID,
  agent_id UUID,
  violation_type VARCHAR(100),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  organization_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Seed baseline policies for a default org if table is empty
DO $$
DECLARE
  has_rows BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM governance_policies) INTO has_rows;
  IF NOT has_rows THEN
    INSERT INTO governance_policies (name, description, type, severity, status, organization_id, applies_to_agents, agent_enforcement)
    VALUES
      ('Data Privacy Protection', 'Ensure agents comply with applicable data privacy regulations.', 'compliance', 'high', 'active', 'Acme Corp', TRUE, 'block'),
      ('Access Control Policy', 'Define access control rules for AI agents operations.', 'security', 'high', 'active', 'Acme Corp', TRUE, 'warn'),
      ('Bias Detection and Mitigation', 'Monitor and mitigate model bias in outputs.', 'ai-ethics', 'medium', 'active', 'Acme Corp', TRUE, 'warn'),
      ('Audit Trail Requirements', 'Comprehensive logging for all AI agent operations.', 'operational', 'medium', 'draft', 'Acme Corp', FALSE, 'audit');
  END IF;
END $$;

-- Optionally seed a couple of open violations if none exist for Acme Corp
DO $$
DECLARE
  has_rows BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM policy_violations WHERE organization_id = 'Acme Corp') INTO has_rows;
  IF NOT has_rows THEN
    INSERT INTO policy_violations (policy_id, agent_id, violation_type, severity, status, description, organization_id)
    VALUES
      (NULL, NULL, 'pii-access', 'high', 'open', 'Detected potential PII access without consent', 'Acme Corp'),
      (NULL, NULL, 'rate-limit', 'medium', 'open', 'Agent exceeded configured request rate', 'Acme Corp');
  END IF;
END $$;
