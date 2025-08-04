-- Create policy_violations table
CREATE TABLE IF NOT EXISTS policy_violations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  user_id INTEGER,
  agent_id VARCHAR(255),
  policy_name VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create security_threats table
CREATE TABLE IF NOT EXISTS security_threats (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  threat_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update connected_agents table to include organization_id
ALTER TABLE connected_agents 
ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- Update existing connected_agents with organization_id
UPDATE connected_agents 
SET organization_id = (
  SELECT organization 
  FROM users 
  WHERE users.id = connected_agents.user_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Update reports table to use organization as string
ALTER TABLE reports 
ALTER COLUMN organization_id TYPE VARCHAR(255);

-- Update notifications table to use organization as string  
ALTER TABLE notifications
ALTER COLUMN organization_id TYPE VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization ON policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_security_threats_organization ON security_threats(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
CREATE INDEX IF NOT EXISTS idx_security_threats_status ON security_threats(status);
CREATE INDEX IF NOT EXISTS idx_connected_agents_organization ON connected_agents(organization_id);
