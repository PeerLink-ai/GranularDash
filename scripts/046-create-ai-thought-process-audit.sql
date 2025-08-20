-- Create AI agent thought process audit table
CREATE TABLE IF NOT EXISTS ai_thought_process_logs (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255), -- Groups related thoughts in a conversation
    thought_type VARCHAR(50) NOT NULL, -- 'reasoning', 'decision', 'analysis', 'planning', 'reflection'
    prompt TEXT, -- The input that triggered the thought
    thought_content TEXT NOT NULL, -- The actual thought process/reasoning
    context_data JSONB, -- Additional context like user data, system state
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence in the reasoning
    reasoning_steps JSONB, -- Array of step-by-step reasoning
    decision_factors JSONB, -- Factors that influenced the decision
    alternatives_considered JSONB, -- Other options that were evaluated
    outcome_prediction TEXT, -- What the agent expects to happen
    actual_outcome TEXT, -- What actually happened (filled later)
    processing_time_ms INTEGER, -- Time taken to generate the thought
    model_used VARCHAR(100), -- Which AI model generated the thought
    temperature DECIMAL(3,2), -- Model temperature setting
    tokens_used INTEGER, -- Token count for the thought generation
    audit_block_hash VARCHAR(64), -- Blockchain hash for integrity
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_agent_id ON ai_thought_process_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_session_id ON ai_thought_process_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_thought_type ON ai_thought_process_logs(thought_type);
CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_created_at ON ai_thought_process_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_thought_logs_confidence ON ai_thought_process_logs(confidence_score);

-- Create table for thought process relationships (linking related thoughts)
CREATE TABLE IF NOT EXISTS ai_thought_relationships (
    id SERIAL PRIMARY KEY,
    parent_thought_id INTEGER REFERENCES ai_thought_process_logs(id) ON DELETE CASCADE,
    child_thought_id INTEGER REFERENCES ai_thought_process_logs(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'follows_from', 'contradicts', 'supports', 'refines'
    strength DECIMAL(3,2) DEFAULT 1.0, -- How strong the relationship is
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(parent_thought_id, child_thought_id)
);

-- Insert sample thought process data for demonstration
INSERT INTO ai_thought_process_logs (
    agent_id, session_id, thought_type, prompt, thought_content, 
    context_data, confidence_score, reasoning_steps, decision_factors,
    processing_time_ms, model_used, temperature, tokens_used
) VALUES 
(
    'agent-001', 
    'session-demo-001', 
    'reasoning',
    'User asks: Should I invest in renewable energy stocks?',
    'I need to analyze multiple factors: market trends, regulatory environment, company fundamentals, and risk tolerance. The renewable energy sector has shown strong growth but also volatility.',
    '{"user_risk_profile": "moderate", "portfolio_size": "medium", "investment_horizon": "long_term"}',
    0.85,
    '["Analyze market trends", "Review regulatory landscape", "Assess company fundamentals", "Consider user risk profile", "Evaluate timing"]',
    '{"market_growth": "positive", "government_support": "strong", "technology_advancement": "rapid", "user_risk_tolerance": "moderate"}',
    1250,
    'gpt-4',
    0.7,
    156
),
(
    'agent-001',
    'session-demo-001',
    'decision',
    'Based on analysis, what specific recommendation should I make?',
    'Given the strong fundamentals and user profile, I recommend a diversified approach: 60% established renewable companies, 30% growth stocks, 10% ETFs. This balances growth potential with risk management.',
    '{"analysis_complete": true, "risk_assessed": true, "diversification_considered": true}',
    0.92,
    '["Weight risk vs reward", "Consider diversification", "Match to user profile", "Set allocation percentages", "Plan implementation strategy"]',
    '{"user_experience": "intermediate", "market_conditions": "favorable", "diversification_need": "high"}',
    890,
    'gpt-4',
    0.3,
    203
);
