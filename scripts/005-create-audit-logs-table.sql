-- Create audit_logs table for activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'info',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_audit_logs_organization (organization),
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_timestamp (timestamp DESC),
  INDEX idx_audit_logs_resource (resource_type, resource_id),
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add organization column to connected_agents if it doesn't exist
ALTER TABLE connected_agents 
ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

-- Update existing connected_agents to have organization from their user
UPDATE connected_agents 
SET organization = (
  SELECT organization 
  FROM users 
  WHERE users.id = connected_agents.user_id
)
WHERE organization IS NULL;

-- Add index for organization on connected_agents
CREATE INDEX IF NOT EXISTS idx_connected_agents_organization ON connected_agents(organization);
