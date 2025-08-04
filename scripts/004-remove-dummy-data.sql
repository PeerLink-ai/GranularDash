-- Remove all dummy/seed data and ensure clean slate for users
-- This script removes any existing dummy data and resets tables

-- Clear existing dummy data
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM compliance_reports WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM risk_assessments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM policy_violations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM scheduled_audits WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM financial_goals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM connected_agents WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM agent_metrics WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM agent_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');

-- Remove demo users
DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%');
DELETE FROM users WHERE email LIKE '%example%' OR email LIKE '%demo%';

-- Create tables for new data types if they don't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quarterly', 'annual', 'ad-hoc', 'monthly', 'internal')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed', 'failed')),
  content JSONB DEFAULT '{}',
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_review', 'mitigated', 'acknowledged', 'closed')),
  description TEXT,
  mitigation_strategy TEXT,
  last_assessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  agent_id TEXT,
  policy_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS scheduled_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  name TEXT NOT NULL,
  audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  lead_auditor TEXT,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_organization ON compliance_reports(organization);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_organization ON risk_assessments(organization);
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization ON policy_violations(organization);
CREATE INDEX IF NOT EXISTS idx_scheduled_audits_organization ON scheduled_audits(organization);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
