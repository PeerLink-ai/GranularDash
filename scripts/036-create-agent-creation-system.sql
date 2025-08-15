-- Agent Creation System Database Schema
-- This creates the infrastructure for users to create AI agents from scratch

-- Agent Templates - Predefined agent types and configurations
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'code', 'data', 'content', 'support', 'custom'
    template_config JSONB NOT NULL, -- Base configuration for this template
    capabilities JSONB DEFAULT '[]', -- List of capabilities this template provides
    required_integrations JSONB DEFAULT '[]', -- Required external integrations
    code_template TEXT, -- Base code template for the agent
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Created Agents - User-created agents (different from connected_agents which are external)
CREATE TABLE IF NOT EXISTS created_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES agent_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'training', 'testing', 'deployed', 'paused', 'error')),
    version VARCHAR(50) DEFAULT '1.0.0',
    source_code TEXT, -- Generated agent code
    deployment_config JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    last_trained_at TIMESTAMP WITH TIME ZONE
);

-- Repository Connections - Link agents to code repositories
CREATE TABLE IF NOT EXISTS agent_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    repository_url VARCHAR(500) NOT NULL,
    repository_type VARCHAR(50) NOT NULL, -- 'github', 'gitlab', 'bitbucket', 'custom'
    branch VARCHAR(255) DEFAULT 'main',
    access_token_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    sync_status VARCHAR(50) DEFAULT 'pending',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency VARCHAR(50) DEFAULT 'on_push', -- 'on_push', 'hourly', 'daily', 'manual'
    file_patterns JSONB DEFAULT '["**/*.js", "**/*.ts", "**/*.py", "**/*.md"]',
    ignore_patterns JSONB DEFAULT '[".git/**", "node_modules/**", "*.log"]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Training Data - Store training examples and feedback
CREATE TABLE IF NOT EXISTS agent_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'example', 'feedback', 'correction', 'context'
    input_data JSONB NOT NULL,
    expected_output JSONB,
    actual_output JSONB,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    feedback_text TEXT,
    source VARCHAR(100), -- 'user', 'repository', 'automated', 'imported'
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Agent Deployments - Track deployment history and configurations
CREATE TABLE IF NOT EXISTS agent_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    deployment_type VARCHAR(50) NOT NULL, -- 'cloud', 'edge', 'local', 'serverless'
    endpoint_url VARCHAR(500),
    deployment_config JSONB NOT NULL DEFAULT '{}',
    environment VARCHAR(50) DEFAULT 'production', -- 'development', 'staging', 'production'
    status VARCHAR(50) DEFAULT 'deploying' CHECK (status IN ('deploying', 'active', 'inactive', 'failed', 'terminated')),
    health_check_url VARCHAR(500),
    metrics JSONB DEFAULT '{}',
    logs_location VARCHAR(500),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terminated_at TIMESTAMP WITH TIME ZONE,
    deployed_by UUID REFERENCES users(id)
);

-- Agent Interactions - Log all interactions with created agents
CREATE TABLE IF NOT EXISTS agent_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    deployment_id UUID REFERENCES agent_deployments(id),
    interaction_type VARCHAR(50) NOT NULL, -- 'query', 'command', 'webhook', 'scheduled'
    input_data JSONB NOT NULL,
    output_data JSONB,
    response_time_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_created_agents_user_id ON created_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_created_agents_status ON created_agents(status);
CREATE INDEX IF NOT EXISTS idx_created_agents_type ON created_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_repositories_agent_id ON agent_repositories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_training_data_agent_id ON agent_training_data(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_agent_id ON agent_deployments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent_id ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created_at ON agent_interactions(created_at);

-- Insert default agent templates
INSERT INTO agent_templates (name, description, category, template_config, capabilities, code_template) VALUES
('Code Assistant', 'AI agent specialized in code analysis, generation, and review', 'code', 
 '{"model": "gpt-4", "temperature": 0.1, "max_tokens": 2000, "specialization": "code"}',
 '["code_generation", "code_review", "bug_detection", "documentation", "refactoring"]',
 'class CodeAssistantAgent {\n  constructor(config) {\n    this.config = config;\n  }\n  \n  async processCode(input) {\n    // Agent implementation\n  }\n}'),

('Data Analyst', 'AI agent for data analysis, visualization, and insights', 'data',
 '{"model": "gpt-4", "temperature": 0.2, "max_tokens": 1500, "specialization": "data"}',
 '["data_analysis", "visualization", "statistical_analysis", "reporting", "predictions"]',
 'class DataAnalystAgent {\n  constructor(config) {\n    this.config = config;\n  }\n  \n  async analyzeData(data) {\n    // Agent implementation\n  }\n}'),

('Content Creator', 'AI agent for content generation, editing, and optimization', 'content',
 '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 2500, "specialization": "content"}',
 '["content_generation", "editing", "seo_optimization", "translation", "summarization"]',
 'class ContentCreatorAgent {\n  constructor(config) {\n    this.config = config;\n  }\n  \n  async createContent(prompt) {\n    // Agent implementation\n  }\n}'),

('Customer Support', 'AI agent for customer service and support automation', 'support',
 '{"model": "gpt-3.5-turbo", "temperature": 0.3, "max_tokens": 1000, "specialization": "support"}',
 '["customer_service", "ticket_routing", "faq_answering", "escalation", "sentiment_analysis"]',
 'class CustomerSupportAgent {\n  constructor(config) {\n    this.config = config;\n  }\n  \n  async handleQuery(query) {\n    // Agent implementation\n  }\n}'),

('Custom Agent', 'Blank template for creating custom AI agents', 'custom',
 '{"model": "gpt-4", "temperature": 0.5, "max_tokens": 1500, "specialization": "custom"}',
 '["custom_logic", "flexible_processing", "configurable_behavior"]',
 'class CustomAgent {\n  constructor(config) {\n    this.config = config;\n  }\n  \n  async process(input) {\n    // Custom agent implementation\n  }\n}');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_created_agents_updated_at BEFORE UPDATE ON created_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_repositories_updated_at BEFORE UPDATE ON agent_repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
