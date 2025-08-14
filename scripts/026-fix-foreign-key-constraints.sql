-- Fix foreign key constraint issues in connected_agents table
-- First, clean up any invalid data that would prevent the constraint

-- Remove any connected_agents records with invalid project_id references
DELETE FROM connected_agents 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);

-- Update any NULL project_id values to reference existing projects or remove them
-- Option 1: Remove records with NULL project_id
DELETE FROM connected_agents WHERE project_id IS NULL;

-- Drop existing constraint if it exists (in case it's malformed)
ALTER TABLE connected_agents DROP CONSTRAINT IF EXISTS connected_agents_project_id_fkey;

-- Add the foreign key constraint properly
ALTER TABLE connected_agents 
ADD CONSTRAINT connected_agents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_connected_agents_project_id ON connected_agents(project_id);
CREATE INDEX IF NOT EXISTS idx_connected_agents_user_id ON connected_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_agents_status ON connected_agents(status);

-- Add some sample data if tables are empty to test the project wizard
INSERT INTO projects (id, name, description, type, repo_url, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'Sample AI Agent Project', 'A sample project for testing the wizard', 'ai-agent', 'https://github.com/example/ai-agent', NOW(), NOW()),
  (gen_random_uuid(), 'Demo Dashboard Project', 'Demo project for dashboard testing', 'dashboard', 'https://github.com/example/dashboard', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Ensure governance policies exist for the wizard
INSERT INTO governance_policies (id, name, description, type, severity, organization_id, status, applies_to_agents, agent_enforcement, created_at, updated_at)
VALUES 
  ('policy-1', 'Data Privacy Policy', 'Ensures all agents comply with data privacy regulations', 'privacy', 'high', 'default', 'active', true, 'strict', NOW(), NOW()),
  ('policy-2', 'Security Standards', 'Enforces security best practices for all agents', 'security', 'critical', 'default', 'active', true, 'strict', NOW(), NOW()),
  ('policy-3', 'Performance Guidelines', 'Maintains performance standards across agents', 'performance', 'medium', 'default', 'active', true, 'advisory', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
