-- First, let's check if the table exists and what columns it has
-- Then update it to match what we need

-- Drop the table if it exists and recreate with the correct schema
DROP TABLE IF EXISTS connected_agents CASCADE;

CREATE TABLE connected_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) UNIQUE DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(255) DEFAULT 'default',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing', 'error')),
    endpoint TEXT NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    usage_requests INTEGER DEFAULT 0,
    usage_tokens_used INTEGER DEFAULT 0,
    usage_estimated_cost DECIMAL(10,4) DEFAULT 0.00,
    api_key_encrypted TEXT,
    configuration JSONB DEFAULT '{}',
    health_status VARCHAR(50) DEFAULT 'healthy',
    last_health_check TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_connected_agents_user_id ON connected_agents(user_id);
CREATE INDEX idx_connected_agents_status ON connected_agents(status);
CREATE INDEX idx_connected_agents_provider ON connected_agents(provider);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_connected_agents_updated_at
    BEFORE UPDATE ON connected_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
