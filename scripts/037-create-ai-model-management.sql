-- AI Model Management System Database Schema
-- This creates the infrastructure for managing AI models used by agents

-- AI Model Providers - Supported AI model providers and their configurations
CREATE TABLE IF NOT EXISTS ai_model_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'huggingface', 'local', 'custom'
    api_endpoint VARCHAR(500),
    authentication_type VARCHAR(50) NOT NULL, -- 'api_key', 'oauth', 'none'
    configuration JSONB NOT NULL DEFAULT '{}',
    supported_features JSONB DEFAULT '[]', -- ['chat', 'completion', 'embedding', 'fine_tuning']
    rate_limits JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models - Available AI models from different providers
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_model_providers(id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL, -- Provider's model identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL, -- 'chat', 'completion', 'embedding', 'multimodal'
    capabilities JSONB DEFAULT '[]',
    context_length INTEGER DEFAULT 4096,
    max_tokens INTEGER DEFAULT 2048,
    input_cost_per_token DECIMAL(12,8) DEFAULT 0,
    output_cost_per_token DECIMAL(12,8) DEFAULT 0,
    training_data_cutoff DATE,
    parameters JSONB DEFAULT '{}', -- Model-specific parameters
    performance_metrics JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, model_id)
);

-- Agent Model Configurations - Model settings for each agent
CREATE TABLE IF NOT EXISTS agent_model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id),
    configuration JSONB NOT NULL DEFAULT '{}', -- temperature, max_tokens, etc.
    system_prompt TEXT,
    is_primary BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model Fine-tuning Jobs - Track fine-tuning operations
CREATE TABLE IF NOT EXISTS model_fine_tuning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    base_model_id UUID NOT NULL REFERENCES ai_models(id),
    job_name VARCHAR(255) NOT NULL,
    provider_job_id VARCHAR(255), -- Provider's job ID
    training_data_id UUID, -- Reference to training dataset
    validation_data_id UUID, -- Reference to validation dataset
    hyperparameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    fine_tuned_model_id VARCHAR(255), -- Provider's fine-tuned model ID
    training_metrics JSONB DEFAULT '{}',
    validation_metrics JSONB DEFAULT '{}',
    cost_estimate DECIMAL(10,4) DEFAULT 0,
    actual_cost DECIMAL(10,4) DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Model Performance Metrics - Track model performance over time
CREATE TABLE IF NOT EXISTS model_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    model_config_id UUID NOT NULL REFERENCES agent_model_configs(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'latency', 'accuracy', 'cost', 'user_satisfaction'
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20), -- 'ms', 'tokens', 'usd', 'percentage'
    context JSONB DEFAULT '{}', -- Additional context about the metric
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model Usage Tracking - Track model usage and costs
CREATE TABLE IF NOT EXISTS model_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    model_config_id UUID NOT NULL REFERENCES agent_model_configs(id) ON DELETE CASCADE,
    interaction_id UUID, -- Reference to agent_interactions if available
    request_type VARCHAR(50) NOT NULL, -- 'chat', 'completion', 'embedding'
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_type VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model Evaluations - Store evaluation results for models
CREATE TABLE IF NOT EXISTS model_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    model_config_id UUID NOT NULL REFERENCES agent_model_configs(id) ON DELETE CASCADE,
    evaluation_name VARCHAR(255) NOT NULL,
    evaluation_type VARCHAR(50) NOT NULL, -- 'benchmark', 'custom', 'a_b_test'
    test_dataset_id UUID, -- Reference to test dataset
    evaluation_config JSONB DEFAULT '{}',
    results JSONB NOT NULL DEFAULT '{}',
    overall_score DECIMAL(5,3),
    detailed_metrics JSONB DEFAULT '{}',
    comparison_baseline VARCHAR(255), -- What this evaluation is compared against
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_model_providers_type ON ai_model_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type);
CREATE INDEX IF NOT EXISTS idx_agent_model_configs_agent_id ON agent_model_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_model_configs_model_id ON agent_model_configs(model_id);
CREATE INDEX IF NOT EXISTS idx_model_fine_tuning_jobs_agent_id ON model_fine_tuning_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_model_fine_tuning_jobs_status ON model_fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_model_performance_metrics_agent_id ON model_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_metrics_type ON model_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_model_usage_tracking_agent_id ON model_usage_tracking(agent_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_tracking_created_at ON model_usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_agent_id ON model_evaluations(agent_id);

-- Insert default AI model providers
INSERT INTO ai_model_providers (name, display_name, provider_type, api_endpoint, authentication_type, configuration, supported_features, rate_limits, pricing) VALUES
('openai', 'OpenAI', 'openai', 'https://api.openai.com/v1', 'api_key', 
 '{"api_version": "v1", "organization": null}',
 '["chat", "completion", "embedding", "fine_tuning", "image_generation"]',
 '{"requests_per_minute": 3500, "tokens_per_minute": 90000}',
 '{"gpt_4": {"input": 0.00003, "output": 0.00006}, "gpt_3_5_turbo": {"input": 0.0000015, "output": 0.000002}}'),

('anthropic', 'Anthropic', 'anthropic', 'https://api.anthropic.com', 'api_key',
 '{"api_version": "2023-06-01"}',
 '["chat", "completion"]',
 '{"requests_per_minute": 1000, "tokens_per_minute": 40000}',
 '{"claude_3_opus": {"input": 0.000015, "output": 0.000075}, "claude_3_sonnet": {"input": 0.000003, "output": 0.000015}}'),

('huggingface', 'Hugging Face', 'huggingface', 'https://api-inference.huggingface.co', 'api_key',
 '{"inference_api": true}',
 '["chat", "completion", "embedding", "classification"]',
 '{"requests_per_hour": 1000}',
 '{"free_tier": {"input": 0, "output": 0}, "pro_tier": {"input": 0.000001, "output": 0.000001}}'),

('local', 'Local Models', 'local', null, 'none',
 '{"supports_custom_endpoints": true}',
 '["chat", "completion", "embedding"]',
 '{}',
 '{"self_hosted": {"input": 0, "output": 0}}');

-- Insert popular AI models
INSERT INTO ai_models (provider_id, model_id, name, description, model_type, capabilities, context_length, max_tokens, input_cost_per_token, output_cost_per_token, parameters) VALUES
-- OpenAI Models
((SELECT id FROM ai_model_providers WHERE name = 'openai'), 'gpt-4', 'GPT-4', 'Most capable GPT-4 model', 'chat', '["reasoning", "code", "math"]', 8192, 4096, 0.00003, 0.00006, '{"temperature": 0.7, "top_p": 1.0}'),
((SELECT id FROM ai_model_providers WHERE name = 'openai'), 'gpt-4-turbo', 'GPT-4 Turbo', 'Latest GPT-4 model with improved performance', 'chat', '["reasoning", "code", "math", "vision"]', 128000, 4096, 0.00001, 0.00003, '{"temperature": 0.7, "top_p": 1.0}'),
((SELECT id FROM ai_model_providers WHERE name = 'openai'), 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Fast and efficient model for most tasks', 'chat', '["general", "code"]', 16385, 4096, 0.0000015, 0.000002, '{"temperature": 0.7, "top_p": 1.0}'),
((SELECT id FROM ai_model_providers WHERE name = 'openai'), 'text-embedding-3-large', 'Text Embedding 3 Large', 'Most capable embedding model', 'embedding', '["semantic_search", "clustering"]', 8191, 0, 0.00000013, 0, '{"dimensions": 3072}'),

-- Anthropic Models
((SELECT id FROM ai_model_providers WHERE name = 'anthropic'), 'claude-3-opus-20240229', 'Claude 3 Opus', 'Most powerful Claude model', 'chat', '["reasoning", "analysis", "creative"]', 200000, 4096, 0.000015, 0.000075, '{"temperature": 0.7, "top_p": 1.0}'),
((SELECT id FROM ai_model_providers WHERE name = 'anthropic'), 'claude-3-sonnet-20240229', 'Claude 3 Sonnet', 'Balanced performance and speed', 'chat', '["reasoning", "analysis"]', 200000, 4096, 0.000003, 0.000015, '{"temperature": 0.7, "top_p": 1.0}'),
((SELECT id FROM ai_model_providers WHERE name = 'anthropic'), 'claude-3-haiku-20240307', 'Claude 3 Haiku', 'Fastest Claude model', 'chat', '["general", "quick_tasks"]', 200000, 4096, 0.00000025, 0.00000125, '{"temperature": 0.7, "top_p": 1.0}');

-- Create triggers for updated_at
CREATE TRIGGER update_ai_model_providers_updated_at BEFORE UPDATE ON ai_model_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_model_configs_updated_at BEFORE UPDATE ON agent_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
