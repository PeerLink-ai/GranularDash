-- Add new columns to governance_policies table
ALTER TABLE governance_policies 
ADD COLUMN IF NOT EXISTS applies_to_agents BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_enforcement VARCHAR(50) DEFAULT 'warn',
ADD COLUMN IF NOT EXISTS compliance_score INTEGER;

-- Create policy_agent_assignments table
CREATE TABLE IF NOT EXISTS policy_agent_assignments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES governance_policies(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

-- Update existing policies to have active status
UPDATE governance_policies SET status = 'active' WHERE status IS NULL;

-- Insert sample policies with agent integration
INSERT INTO governance_policies (
    organization_id, 
    name, 
    description, 
    type, 
    severity, 
    status, 
    applies_to_agents, 
    agent_enforcement,
    compliance_score
) VALUES 
('Hive', 'Data Privacy Protection', 'Ensure all AI agents comply with data privacy regulations', 'data-governance', 'high', 'active', true, 'block', 95),
('Hive', 'Bias Detection and Mitigation', 'Monitor and prevent discriminatory outputs from AI models', 'ai-ethics', 'high', 'active', true, 'warn', 88),
('Hive', 'Content Filtering Policy', 'Block inappropriate or harmful content generation', 'security', 'medium', 'active', true, 'block', 92),
('Hive', 'Rate Limiting Policy', 'Prevent excessive API usage and potential abuse', 'operational', 'medium', 'active', true, 'audit', 100),
('Hive', 'Model Output Validation', 'Validate AI model outputs for accuracy and safety', 'security', 'high', 'active', true, 'warn', 85);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policy_agent_assignments_policy ON policy_agent_assignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_agent_assignments_agent ON policy_agent_assignments(agent_id);
