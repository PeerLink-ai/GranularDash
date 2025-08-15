-- Create missing base tables for agent creation system

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES users(id),
    billing_email VARCHAR(255),
    max_agents INTEGER DEFAULT 5,
    max_repositories INTEGER DEFAULT 10
);

-- Create created_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS created_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(100) NOT NULL,
    template_id UUID,
    configuration JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITHOUT TIME ZONE,
    deployment_url TEXT,
    repository_id UUID,
    model_config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    performance_metrics JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITHOUT TIME ZONE
);

-- Create agent_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    template_config JSONB NOT NULL,
    default_capabilities JSONB DEFAULT '[]',
    required_integrations JSONB DEFAULT '[]',
    complexity_level VARCHAR(20) DEFAULT 'beginner',
    estimated_setup_time INTEGER DEFAULT 30,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    tags JSONB DEFAULT '[]'
);

-- Create repositories table if it doesn't exist
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- github, gitlab, bitbucket
    repository_id VARCHAR(255), -- external repo ID
    branch VARCHAR(100) DEFAULT 'main',
    access_token_encrypted TEXT,
    webhook_secret TEXT,
    sync_status VARCHAR(50) DEFAULT 'pending',
    last_sync TIMESTAMP WITHOUT TIME ZONE,
    file_count INTEGER DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    languages JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    sync_config JSONB DEFAULT '{}',
    analysis_results JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_created_agents_org ON created_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_created_agents_creator ON created_agents(created_by);
CREATE INDEX IF NOT EXISTS idx_created_agents_status ON created_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_agent_templates_org ON agent_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_repositories_org ON repositories(organization_id);
CREATE INDEX IF NOT EXISTS idx_repositories_provider ON repositories(provider);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_created_agents_updated_at BEFORE UPDATE ON created_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization if none exists
INSERT INTO organizations (name, slug, description, owner_id)
SELECT 'Default Organization', 'default', 'Default organization for system', (SELECT id FROM users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- Insert some default agent templates
INSERT INTO agent_templates (name, description, category, template_config, default_capabilities, complexity_level) VALUES
('Code Assistant', 'AI agent that helps with code review and suggestions', 'development', 
 '{"model": "gpt-4", "temperature": 0.3, "max_tokens": 2000}', 
 '["code_review", "bug_detection", "documentation"]', 'intermediate'),
('Customer Support Bot', 'AI agent for handling customer inquiries', 'support', 
 '{"model": "gpt-3.5-turbo", "temperature": 0.7, "max_tokens": 1000}', 
 '["natural_language", "ticket_routing", "knowledge_base"]', 'beginner'),
('Data Analyst', 'AI agent for data analysis and insights', 'analytics', 
 '{"model": "gpt-4", "temperature": 0.2, "max_tokens": 3000}', 
 '["data_processing", "visualization", "reporting"]', 'advanced')
ON CONFLICT DO NOTHING;
