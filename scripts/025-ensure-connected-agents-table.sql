-- Ensure connected_agents table exists for project wizard
CREATE TABLE IF NOT EXISTS connected_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text DEFAULT 'openai',
  model text DEFAULT 'gpt-4o',
  endpoint text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id text NOT NULL,
  project_id uuid,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connected_agents_user_id ON connected_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_agents_project_id ON connected_agents(project_id);
CREATE INDEX IF NOT EXISTS idx_connected_agents_status ON connected_agents(status);
