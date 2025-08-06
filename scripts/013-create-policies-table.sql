-- Create policies table if it doesn't exist
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    severity VARCHAR(50) DEFAULT 'medium',
    rules JSONB DEFAULT '{}',
    organization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policy_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    agent_id UUID,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    organization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_organization ON policies(organization);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization ON policy_violations(organization);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_policy_id ON policy_violations(policy_id);

-- Insert some sample policies for demonstration
INSERT INTO policies (name, description, type, severity, organization) VALUES
('Data Privacy Protection', 'Ensures all AI agents comply with data privacy regulations', 'compliance', 'high', 'Acme Corp'),
('Access Control Policy', 'Defines access control rules for AI agent operations', 'security', 'high', 'Acme Corp'),
('Model Bias Prevention', 'Prevents biased decision-making in AI models', 'data-governance', 'medium', 'Acme Corp'),
('Audit Trail Requirements', 'Mandates comprehensive logging for all AI operations', 'operational', 'medium', 'Acme Corp')
ON CONFLICT DO NOTHING;
