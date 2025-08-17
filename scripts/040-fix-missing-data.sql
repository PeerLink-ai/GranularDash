-- Fix missing data that's causing API errors

-- First, let's ensure we have some policies with predictable IDs for testing
INSERT INTO governance_policies (id, name, description, type, severity, status, organization_id, applies_to_agents, agent_enforcement, compliance_score)
VALUES 
  ('policy-1', 'Data Privacy Protection', 'Ensure agents comply with applicable data privacy regulations.', 'compliance', 'high', 'active', 'Hive', TRUE, 'block', 92),
  ('policy-2', 'Access Control Policy', 'Define access control rules for AI agents operations.', 'security', 'high', 'active', 'Hive', TRUE, 'warn', 88),
  ('policy-3', 'Bias Detection and Mitigation', 'Monitor and mitigate model bias in outputs.', 'ai-ethics', 'medium', 'active', 'Hive', TRUE, 'warn', 85)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Add some policy assignments for testing
INSERT INTO policy_agent_assignments (policy_id, agent_id, assigned_at, status)
VALUES 
  ('policy-1', 'agent-1', NOW(), 'active'),
  ('policy-1', 'agent-2', NOW(), 'active'),
  ('policy-2', 'agent-1', NOW(), 'active'),
  ('policy-2', 'agent-3', NOW(), 'active')
ON CONFLICT (policy_id, agent_id) DO UPDATE SET
  status = EXCLUDED.status,
  assigned_at = EXCLUDED.assigned_at;

-- Ensure we have training simulation with ID 35 for testing
INSERT INTO training_simulations (id, organization_id, name, type, description, status, duration_minutes, participants_count, pass_threshold, difficulty_level, configuration, created_at)
VALUES 
  (35, 'Hive', 'API Test Simulation', 'Security Awareness', 'Test simulation for API endpoints', 'scheduled', 60, 0, 80, 'intermediate', '{"test": true}', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
