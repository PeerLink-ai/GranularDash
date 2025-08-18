-- Create comprehensive governance audit tables
CREATE TABLE IF NOT EXISTS agent_governance_logs (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'test', 'query', 'response', 'evaluation'
    prompt TEXT,
    response TEXT,
    response_time_ms INTEGER,
    token_usage JSONB, -- {prompt: number, completion: number, total: number}
    quality_scores JSONB, -- {relevance: number, accuracy: number, safety: number, overall: number}
    evaluation_flags JSONB, -- Array of flags like ['safety:harmful', 'quality:too_short']
    audit_block_hash VARCHAR(64) NOT NULL, -- SHA-256 hash from blockchain
    audit_block_signature TEXT, -- RSA signature for verification
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_governance_logs_agent_id ON agent_governance_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_created_at ON agent_governance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_governance_logs_interaction_type ON agent_governance_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_governance_logs_audit_hash ON agent_governance_logs(audit_block_hash);

-- Create table for storing cryptographic chain metadata
CREATE TABLE IF NOT EXISTS governance_chain_metadata (
    id SERIAL PRIMARY KEY,
    chain_version VARCHAR(20) DEFAULT '1.0.0',
    genesis_block_hash VARCHAR(64) NOT NULL,
    current_block_count INTEGER DEFAULT 0,
    last_validation_timestamp TIMESTAMP DEFAULT NOW(),
    chain_integrity_status VARCHAR(20) DEFAULT 'VERIFIED', -- 'VERIFIED' or 'COMPROMISED'
    public_key_fingerprint VARCHAR(128),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for continuous monitoring rules
CREATE TABLE IF NOT EXISTS governance_monitoring_rules (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255),
    rule_type VARCHAR(50) NOT NULL, -- 'quality_threshold', 'safety_check', 'response_time', 'token_limit'
    rule_config JSONB NOT NULL, -- Configuration for the rule
    is_active BOOLEAN DEFAULT true,
    violation_action VARCHAR(50) DEFAULT 'alert', -- 'alert', 'block', 'throttle'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for real-time governance alerts
CREATE TABLE IF NOT EXISTS governance_alerts (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'quality_degradation', 'safety_violation', 'performance_issue'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    metadata JSONB, -- Additional context about the alert
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255)
);

-- Insert initial chain metadata
INSERT INTO governance_chain_metadata (
    chain_version, 
    genesis_block_hash, 
    current_block_count,
    chain_integrity_status
) VALUES (
    '1.0.0',
    'genesis_placeholder_hash',
    1,
    'VERIFIED'
) ON CONFLICT DO NOTHING;

-- Insert default monitoring rules
INSERT INTO governance_monitoring_rules (agent_id, rule_type, rule_config, is_active) VALUES
('*', 'quality_threshold', '{"overall_score": 70, "safety_score": 80}', true),
('*', 'response_time', '{"max_ms": 30000}', true),
('*', 'token_limit', '{"max_tokens": 2000}', true),
('*', 'safety_check', '{"blocked_keywords": ["harmful", "dangerous", "illegal"]}', true)
ON CONFLICT DO NOTHING;
