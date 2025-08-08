-- Create training modules table
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

-- Create training simulations table
CREATE TABLE IF NOT EXISTS training_simulations (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    last_run TIMESTAMP,
    score INTEGER,
    configuration JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create security threats table
CREATE TABLE IF NOT EXISTS security_threats (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    metadata JSONB
);

-- Insert sample training modules
INSERT INTO training_modules (organization_id, name, type, description) VALUES
('Hive', 'Phishing Detection Training', 'Security', 'Learn to identify and respond to phishing attempts'),
('Hive', 'Data Privacy Fundamentals', 'Compliance', 'Understanding data protection regulations and best practices'),
('Hive', 'AI Ethics Workshop', 'Ethical AI', 'Exploring ethical considerations in AI development and deployment'),
('Hive', 'Incident Response Procedures', 'Security', 'Step-by-step guide for handling security incidents'),
('Hive', 'Access Control Best Practices', 'Security', 'Managing user permissions and access controls');

-- Insert sample training simulations
INSERT INTO training_simulations (organization_id, name, type, description, status, last_run, score) VALUES
('Hive', 'Phishing Attack Simulation', 'Security', 'Simulated phishing campaign to test employee awareness', 'completed', '2023-07-10', 85),
('Hive', 'Data Breach Response Drill', 'Incident Response', 'Tabletop exercise for data breach incident response team', 'scheduled', NULL, NULL),
('Hive', 'AI Bias Detection Training', 'Ethical AI', 'Training module on identifying and mitigating AI model bias', 'completed', '2023-06-25', 92),
('Hive', 'Compliance Policy Review', 'Compliance', 'Interactive module for reviewing new regulatory compliance policies', 'in_progress', '2023-07-01', NULL),
('Hive', 'Social Engineering Awareness', 'Security', 'Training on recognizing social engineering tactics', 'completed', '2023-06-15', 78);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_modules_org ON training_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_simulations_org ON training_simulations(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_org ON security_threats(organization_id);
