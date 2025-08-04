-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    rules JSONB NOT NULL DEFAULT '{}',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    organization_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policy_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    agent_id UUID,
    violation_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    organization_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_organization_id ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(type);
CREATE INDEX IF NOT EXISTS idx_policies_severity ON policies(severity);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);

CREATE INDEX IF NOT EXISTS idx_policy_violations_policy_id ON policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization_id ON policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created_at ON policy_violations(created_at);

-- Insert sample policies for demonstration
INSERT INTO policies (name, type, description, rules, severity, status, organization_id, created_by) VALUES
('Data Privacy Protection', 'data-privacy', 'Ensures all personal data is handled according to privacy regulations', '{"conditions": ["data_type == personal"], "actions": ["encrypt", "audit_access"]}', 'high', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('AI Model Bias Detection', 'ai-ethics', 'Monitors AI models for potential bias in decision making', '{"conditions": ["model_output_variance > 0.3"], "actions": ["flag_for_review", "notify_admin"]}', 'critical', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('Access Control Validation', 'access-control', 'Validates that users have appropriate permissions for requested actions', '{"conditions": ["user_role", "resource_sensitivity"], "actions": ["check_permissions", "log_access"]}', 'medium', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('Security Incident Response', 'security', 'Defines response procedures for security incidents', '{"conditions": ["threat_level >= high"], "actions": ["isolate_system", "notify_security_team", "create_incident"]}', 'critical', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('Compliance Audit Trail', 'compliance', 'Maintains comprehensive audit trails for compliance requirements', '{"conditions": ["sensitive_operation"], "actions": ["log_detailed", "require_approval"]}', 'high', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert sample policy violations for demonstration
INSERT INTO policy_violations (policy_id, violation_type, description, severity, status, organization_id) VALUES
((SELECT id FROM policies WHERE name = 'Data Privacy Protection' LIMIT 1), 'unauthorized_access', 'Attempted access to personal data without proper authorization', 'high', 'investigating', '00000000-0000-0000-0000-000000000001'),
((SELECT id FROM policies WHERE name = 'AI Model Bias Detection' LIMIT 1), 'bias_detected', 'AI model showing potential bias in loan approval decisions', 'critical', 'open', '00000000-0000-0000-0000-000000000001'),
((SELECT id FROM policies WHERE name = 'Access Control Validation' LIMIT 1), 'permission_escalation', 'User attempted to access resources beyond their permission level', 'medium', 'resolved', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
