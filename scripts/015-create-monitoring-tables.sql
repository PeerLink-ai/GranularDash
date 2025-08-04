-- Create monitoring and compliance tables

-- Agent logs table (already exists, but ensure it has the right structure)
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agent metrics table (already exists, but ensure it has the right structure)  
CREATE TABLE IF NOT EXISTS agent_metrics (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('request', 'token_usage', 'cost', 'error', 'response_time')),
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Policy violations table (already exists, but ensure it has the right structure)
CREATE TABLE IF NOT EXISTS policy_violations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization TEXT NOT NULL,
  agent_id TEXT,
  policy_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Compliance reports table (already exists, but ensure it has the right structure)
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

-- Security threats table
CREATE TABLE IF NOT EXISTS security_threats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization TEXT NOT NULL,
  agent_id TEXT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('detected', 'investigating', 'mitigated', 'false_positive')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mitigated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Governance policies table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_timestamp ON agent_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_type ON agent_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_policy_violations_agent_id ON policy_violations(agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);

CREATE INDEX IF NOT EXISTS idx_security_threats_agent_id ON security_threats(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_status ON security_threats(status);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
