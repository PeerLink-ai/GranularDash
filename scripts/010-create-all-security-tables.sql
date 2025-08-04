-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  security_alerts BOOLEAN DEFAULT true,
  policy_violations BOOLEAN DEFAULT true,
  agent_anomalies BOOLEAN DEFAULT false,
  compliance_updates BOOLEAN DEFAULT false,
  access_changes BOOLEAN DEFAULT false,
  system_health BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  severity VARCHAR(50) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create policy_violations table
CREATE TABLE IF NOT EXISTS policy_violations (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
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
  organization_id VARCHAR(255) NOT NULL,
  threat_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'generating',
  organization_id VARCHAR(255) NOT NULL,
  created_by INTEGER,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update connected_agents table to include organization_id if not exists
ALTER TABLE connected_agents 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Update existing connected_agents with organization_id
UPDATE connected_agents 
SET organization_id = 'demo-org'
WHERE organization_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization ON policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_security_threats_organization ON security_threats(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
CREATE INDEX IF NOT EXISTS idx_security_threats_status ON security_threats(status);
CREATE INDEX IF NOT EXISTS idx_reports_organization ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_connected_agents_organization ON connected_agents(organization_id);
