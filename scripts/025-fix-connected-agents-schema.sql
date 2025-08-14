-- Fix connected_agents table schema to match API expectations
-- This ensures the project wizard can properly create agent connections

-- Drop and recreate connected_agents table with correct schema
DROP TABLE IF EXISTS connected_agents CASCADE;

CREATE TABLE connected_agents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL DEFAULT 'unknown',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    connection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configuration JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_connected_agents_project_id ON connected_agents(project_id);
CREATE INDEX idx_connected_agents_agent_id ON connected_agents(agent_id);
CREATE INDEX idx_connected_agents_status ON connected_agents(status);
CREATE INDEX idx_connected_agents_agent_type ON connected_agents(agent_type);

-- Insert some sample connected agents for testing
INSERT INTO connected_agents (project_id, agent_id, agent_name, agent_type, status, configuration) VALUES
(1, 'agent_001', 'Data Processing Agent', 'data_processor', 'active', '{"max_concurrent_jobs": 5, "timeout": 30}'),
(1, 'agent_002', 'Analytics Agent', 'analytics', 'active', '{"reporting_interval": "daily", "metrics": ["performance", "usage"]}'),
(2, 'agent_003', 'Security Monitor', 'security', 'active', '{"scan_frequency": "hourly", "alert_threshold": "medium"}'),
(2, 'agent_004', 'Compliance Checker', 'compliance', 'active', '{"standards": ["SOX", "GDPR"], "audit_level": "strict"}');

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_connected_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_connected_agents_updated_at
    BEFORE UPDATE ON connected_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_connected_agents_updated_at();
