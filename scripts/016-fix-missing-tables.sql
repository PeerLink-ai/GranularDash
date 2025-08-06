-- Create missing tables for deployment fix

-- Create policies table if not exists
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    rules JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
);

-- Create policy_violations table if not exists
CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    policy_id UUID REFERENCES policies(id),
    agent_id UUID REFERENCES connected_agents(id),
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID
);

-- Create security_threats table if not exists
CREATE TABLE IF NOT EXISTS security_threats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_id UUID REFERENCES connected_agents(id),
    threat_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    description TEXT,
    source VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID
);

-- Create access_rules table if not exists
CREATE TABLE IF NOT EXISTS access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    conditions JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
);

-- Create compliance_reports table if not exists
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    data JSONB DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT NOW(),
    generated_by UUID,
    file_path VARCHAR(500)
);

-- Create risk_assessments table if not exists
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    agent_id UUID REFERENCES connected_agents(id),
    assessment_type VARCHAR(100) NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'medium',
    findings JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    assessed_at TIMESTAMP DEFAULT NOW(),
    assessed_by UUID,
    next_assessment TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_org_id ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_org_id ON policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_agent_id ON policy_violations(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_org_id ON security_threats(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_agent_id ON security_threats(agent_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_org_id ON access_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_org_id ON compliance_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_org_id ON risk_assessments(organization_id);

-- Update users table to ensure all required columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create organizations table if not exists
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default organization if none exists
INSERT INTO organizations (id, name, description)
SELECT gen_random_uuid(), 'Default Organization', 'Default organization for AI governance'
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- Update users without organization_id to use default organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;
