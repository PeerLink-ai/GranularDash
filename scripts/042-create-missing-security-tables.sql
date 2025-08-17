-- Create policy_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_violations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  organization VARCHAR(255),
  agent_id VARCHAR(255),
  policy_id VARCHAR(255),
  violation_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Create security_threats table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_threats (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  organization VARCHAR(255),
  threat_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Add security_score column to connected_agents if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'connected_agents' AND column_name = 'security_score'
  ) THEN
    ALTER TABLE connected_agents ADD COLUMN security_score INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Insert sample policy violations
INSERT INTO policy_violations (organization_id, organization, agent_id, policy_id, violation_type, severity, status, description, created_at) VALUES
(1, '1', 'agent-007', 'policy-1', 'rate_limit_exceeded', 'medium', 'open', 'Agent exceeded rate limit of 1000 requests per hour', NOW() - INTERVAL '2 days'),
(1, '1', 'agent-123', 'policy-2', 'unauthorized_access', 'high', 'resolved', 'Agent attempted to access restricted data', NOW() - INTERVAL '5 days'),
(1, '1', 'agent-456', 'policy-1', 'data_retention', 'low', 'open', 'Agent retained data beyond policy limit', NOW() - INTERVAL '1 day'),
(1, '1', 'agent-789', 'policy-3', 'compliance_violation', 'high', 'open', 'Agent violated GDPR compliance requirements', NOW() - INTERVAL '3 days'),
(1, '1', 'agent-007', 'policy-2', 'rate_limit_exceeded', 'medium', 'resolved', 'Agent exceeded rate limit - resolved by increasing limit', NOW() - INTERVAL '7 days');

-- Insert sample security threats
INSERT INTO security_threats (organization_id, organization, threat_type, severity, status, source, description, created_at) VALUES
(1, '1', 'suspicious_activity', 'high', 'active', 'agent-007', 'Unusual API access pattern detected', NOW() - INTERVAL '1 day'),
(1, '1', 'failed_authentication', 'medium', 'resolved', 'external', 'Multiple failed login attempts from unknown IP', NOW() - INTERVAL '3 days'),
(1, '1', 'data_exfiltration_attempt', 'critical', 'active', 'agent-456', 'Potential data exfiltration detected', NOW() - INTERVAL '6 hours'),
(1, '1', 'malware_detection', 'high', 'resolved', 'system_scan', 'Malware signature detected in uploaded file', NOW() - INTERVAL '5 days'),
(1, '1', 'privilege_escalation', 'medium', 'active', 'agent-123', 'Agent attempted privilege escalation', NOW() - INTERVAL '2 days');

-- Update connected_agents with security scores
UPDATE connected_agents SET security_score = 95 WHERE name LIKE '%GPT%' OR name LIKE '%Assistant%';
UPDATE connected_agents SET security_score = 92 WHERE name LIKE '%Claude%' OR name LIKE '%Analyst%';
UPDATE connected_agents SET security_score = 88 WHERE name LIKE '%Code%' OR name LIKE '%Helper%';
UPDATE connected_agents SET security_score = 85 WHERE security_score IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_violations_org ON policy_violations(organization_id, organization);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created ON policy_violations(created_at);
CREATE INDEX IF NOT EXISTS idx_security_threats_org ON security_threats(organization_id, organization);
CREATE INDEX IF NOT EXISTS idx_security_threats_created ON security_threats(created_at);
