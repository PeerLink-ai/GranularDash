-- Agent Trial System Database Schema
-- Creates comprehensive trial management infrastructure

-- Agent trial plans and configurations
CREATE TABLE IF NOT EXISTS agent_trial_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL DEFAULT 14,
    max_requests INTEGER NOT NULL DEFAULT 1000,
    max_tokens INTEGER NOT NULL DEFAULT 100000,
    max_agents INTEGER NOT NULL DEFAULT 3,
    features JSONB DEFAULT '{}',
    pricing_after_trial DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active agent trials
CREATE TABLE IF NOT EXISTS agent_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    trial_plan_id INTEGER REFERENCES agent_trial_plans(id),
    agent_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'converted', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    requests_used INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    agents_connected INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    conversion_date TIMESTAMP,
    trial_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trial usage tracking
CREATE TABLE IF NOT EXISTS agent_trial_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES agent_trials(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN ('request', 'token', 'connection', 'feature')),
    usage_amount INTEGER NOT NULL DEFAULT 1,
    usage_metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trial performance metrics
CREATE TABLE IF NOT EXISTS agent_trial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES agent_trials(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Trial notifications and alerts
CREATE TABLE IF NOT EXISTS agent_trial_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES agent_trials(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_trials_user_id ON agent_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_trials_status ON agent_trials(status);
CREATE INDEX IF NOT EXISTS idx_agent_trials_expires_at ON agent_trials(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_trial_usage_trial_id ON agent_trial_usage(trial_id);
CREATE INDEX IF NOT EXISTS idx_agent_trial_usage_recorded_at ON agent_trial_usage(recorded_at);
CREATE INDEX IF NOT EXISTS idx_agent_trial_metrics_trial_id ON agent_trial_metrics(trial_id);
CREATE INDEX IF NOT EXISTS idx_agent_trial_metrics_recorded_at ON agent_trial_metrics(recorded_at);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_trial_plans_updated_at BEFORE UPDATE ON agent_trial_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_trials_updated_at BEFORE UPDATE ON agent_trials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default trial plans
INSERT INTO agent_trial_plans (name, description, duration_days, max_requests, max_tokens, max_agents, features, pricing_after_trial) VALUES
('Starter Trial', 'Basic trial for new users to explore agent capabilities', 7, 500, 50000, 1, '{"basic_analytics": true, "email_support": true}', 29.99),
('Professional Trial', 'Extended trial with advanced features for serious users', 14, 2000, 200000, 3, '{"advanced_analytics": true, "priority_support": true, "custom_integrations": true}', 99.99),
('Enterprise Trial', 'Full-featured trial for enterprise evaluation', 30, 10000, 1000000, 10, '{"enterprise_analytics": true, "dedicated_support": true, "custom_integrations": true, "sla_guarantee": true}', 499.99)
ON CONFLICT DO NOTHING;
