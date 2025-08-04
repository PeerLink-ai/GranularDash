-- Create monitoring and compliance tables

-- Agent logs table (updated structure for monitoring interactions)
CREATE TABLE IF NOT EXISTS agent_logs (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(100) NOT NULL,
  input_data TEXT,
  output_data TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) ON DELETE CASCADE
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id_timestamp ON agent_logs(agent_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_interaction_type ON agent_logs(interaction_type);

-- Agent metrics table (updated structure for aggregated data)
CREATE TABLE IF NOT EXISTS agent_metrics (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_interactions INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  avg_response_time FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) ON DELETE CASCADE,
  UNIQUE(agent_id, date)
);

-- Policy violations table (updated structure)
CREATE TABLE IF NOT EXISTS policy_violations (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  log_id VARCHAR(255),
  violation_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  metadata JSONB DEFAULT '{}',
  FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) ON DELETE CASCADE,
  FOREIGN KEY (log_id) REFERENCES agent_logs(id) ON DELETE SET NULL
);

-- Create indexes for policy violations
CREATE INDEX IF NOT EXISTS idx_policy_violations_agent_id ON policy_violations(agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX IF NOT EXISTS idx_policy_violations_detected_at ON policy_violations(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);

-- Compliance reports table (remains unchanged)
CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quarterly', 'annual', 'ad-hoc', 'monthly', 'internal')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'failed')),
  content JSONB NOT NULL,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security threats table (updated structure)
CREATE TABLE IF NOT EXISTS security_threats (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255),
  threat_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  source_ip VARCHAR(45),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) ON DELETE SET NULL
);

-- Governance policies table (remains unchanged)
CREATE TABLE IF NOT EXISTS governance_policies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL,
  rules JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notification settings table if not exists
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  webhook_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(date);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_updated_at ON agent_metrics(updated_at);

CREATE INDEX IF NOT EXISTS idx_security_threats_agent_id ON security_threats(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_status ON security_threats(severity);

-- Update connected_agents table to ensure all required columns exist
ALTER TABLE connected_agents 
ADD COLUMN IF NOT EXISTS api_key_encrypted VARCHAR(255),
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_status VARCHAR(50) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE;
