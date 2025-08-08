-- Ensure users table has correct structure
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    organization VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure connected_agents table exists
CREATE TABLE IF NOT EXISTS connected_agents (
    id SERIAL PRIMARY KEY,
    organization VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    api_key TEXT,
    status VARCHAR(50) DEFAULT 'active',
    health_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    configuration JSONB,
    metadata JSONB
);

-- Ensure governance_policies table exists with correct structure
CREATE TABLE IF NOT EXISTS governance_policies (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    applies_to_agents BOOLEAN DEFAULT FALSE,
    agent_enforcement VARCHAR(50) DEFAULT 'warn',
    compliance_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure policy_violations table exists
CREATE TABLE IF NOT EXISTS policy_violations (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    policy_id INTEGER REFERENCES governance_policies(id),
    agent_id VARCHAR(255),
    user_id INTEGER,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    description TEXT,
    metadata JSONB,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Ensure training_modules table exists
CREATE TABLE IF NOT EXISTS training_modules (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    content JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure training_simulations table exists
CREATE TABLE IF NOT EXISTS training_simulations (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    last_run TIMESTAMP,
    completed_at TIMESTAMP,
    score INTEGER,
    configuration JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure policy_agent_assignments table exists
CREATE TABLE IF NOT EXISTS policy_agent_assignments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES governance_policies(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

-- Insert sample data if tables are empty
INSERT INTO users (email, organization, role, session_token) 
SELECT 'admin@hive.com', 'Hive', 'admin', 'sample-session-token'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hive.com');

-- Insert sample connected agents
INSERT INTO connected_agents (organization, name, provider, model, status, health_status) VALUES
('Hive', 'GPT-4 Assistant', 'openai', 'gpt-4', 'active', 'healthy'),
('Hive', 'Claude Assistant', 'anthropic', 'claude-3', 'active', 'healthy'),
('Hive', 'Groq Lightning', 'groq', 'llama-3', 'active', 'healthy')
ON CONFLICT DO NOTHING;

-- Insert sample training modules
INSERT INTO training_modules (organization_id, name, type, description) VALUES
('Hive', 'Phishing Detection Training', 'Security', 'Learn to identify and respond to phishing attempts'),
('Hive', 'Data Privacy Fundamentals', 'Compliance', 'Understanding data protection regulations and best practices'),
('Hive', 'AI Ethics Workshop', 'Ethical AI', 'Exploring ethical considerations in AI development and deployment'),
('Hive', 'Incident Response Procedures', 'Security', 'Step-by-step guide for handling security incidents'),
('Hive', 'Access Control Best Practices', 'Security', 'Managing user permissions and access controls')
ON CONFLICT DO NOTHING;

-- Insert sample training simulations
INSERT INTO training_simulations (organization_id, name, type, description, status, last_run, score, completed_at) VALUES
('Hive', 'Phishing Attack Simulation', 'Security', 'Simulated phishing campaign to test employee awareness', 'completed', '2023-07-10', 85, '2023-07-10'),
('Hive', 'Data Breach Response Drill', 'Incident Response', 'Tabletop exercise for data breach incident response team', 'scheduled', NULL, NULL, NULL),
('Hive', 'AI Bias Detection Training', 'Ethical AI', 'Training module on identifying and mitigating AI model bias', 'completed', '2023-06-25', 92, '2023-06-25'),
('Hive', 'Compliance Policy Review', 'Compliance', 'Interactive module for reviewing new regulatory compliance policies', 'in_progress', '2023-07-01', NULL, NULL),
('Hive', 'Social Engineering Awareness', 'Security', 'Training on recognizing social engineering tactics', 'completed', '2023-06-15', 78, '2023-06-15')
ON CONFLICT DO NOTHING;

-- Insert sample governance policies
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
('Hive', 'Model Output Validation', 'Validate AI model outputs for accuracy and safety', 'security', 'high', 'active', true, 'warn', 85)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connected_agents_org ON connected_agents(organization);
CREATE INDEX IF NOT EXISTS idx_governance_policies_org ON governance_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_org ON policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_org ON training_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_simulations_org ON training_simulations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_agent_assignments_policy ON policy_agent_assignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_agent_assignments_agent ON policy_agent_assignments(agent_id);
