-- Add organization column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization') THEN
        ALTER TABLE users ADD COLUMN organization VARCHAR(255) DEFAULT 'default-org';
    END IF;
END $$;

-- Update existing users to have an organization if they don't have one
UPDATE users SET organization = 'default-org' WHERE organization IS NULL OR organization = '';

-- Create access_rules table
CREATE TABLE IF NOT EXISTS access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    description TEXT,
    content JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policy_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization VARCHAR(255) NOT NULL,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    agent_id UUID,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_rules_organization ON access_rules(organization);
CREATE INDEX IF NOT EXISTS idx_access_rules_status ON access_rules(status);
CREATE INDEX IF NOT EXISTS idx_policies_organization ON policies(organization);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_organization ON policy_violations(organization);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created_at ON policy_violations(created_at);

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_access_rules_updated_at ON access_rules;
CREATE TRIGGER update_access_rules_updated_at
    BEFORE UPDATE ON access_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
