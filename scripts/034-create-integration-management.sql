-- Integration Management System Database Schema
-- Creates comprehensive integration and API management infrastructure

-- Integration registry and definitions
CREATE TABLE IF NOT EXISTS integration_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL, -- 'api', 'webhook', 'database', 'message_queue', 'file_system'
    provider VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    endpoint_url TEXT,
    authentication_type VARCHAR(100), -- 'api_key', 'oauth2', 'basic_auth', 'jwt', 'certificate'
    authentication_config JSONB,
    connection_config JSONB NOT NULL,
    data_schema JSONB,
    rate_limits JSONB,
    timeout_config JSONB DEFAULT '{"connect": 5000, "read": 30000}',
    retry_config JSONB DEFAULT '{"max_attempts": 3, "backoff_strategy": "exponential"}',
    health_check_config JSONB,
    is_active BOOLEAN DEFAULT true,
    is_critical BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration instances and connections
CREATE TABLE IF NOT EXISTS integration_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID REFERENCES integration_registry(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'production', -- 'development', 'staging', 'production'
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'maintenance', 'deprecated')),
    connection_string TEXT,
    credentials_encrypted TEXT,
    configuration JSONB DEFAULT '{}',
    last_health_check TIMESTAMP,
    health_status VARCHAR(50) DEFAULT 'unknown',
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_success TIMESTAMP,
    usage_stats JSONB DEFAULT '{}',
    user_id UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API gateway routing and management
CREATE TABLE IF NOT EXISTS api_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_path VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    integration_instance_id UUID REFERENCES integration_instances(id),
    upstream_path VARCHAR(500),
    route_config JSONB DEFAULT '{}',
    middleware_config JSONB DEFAULT '[]',
    rate_limit_config JSONB,
    cache_config JSONB,
    authentication_required BOOLEAN DEFAULT true,
    authorization_rules JSONB DEFAULT '[]',
    request_transformation JSONB,
    response_transformation JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration execution logs and audit trail
CREATE TABLE IF NOT EXISTS integration_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_instance_id UUID REFERENCES integration_instances(id),
    execution_type VARCHAR(100) NOT NULL, -- 'api_call', 'webhook_received', 'scheduled_job', 'health_check'
    request_id VARCHAR(255),
    method VARCHAR(10),
    endpoint VARCHAR(500),
    request_headers JSONB,
    request_body TEXT,
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    execution_time_ms INTEGER,
    error_message TEXT,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook management and event handling
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_name VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL UNIQUE,
    integration_instance_id UUID REFERENCES integration_instances(id),
    event_types JSONB NOT NULL DEFAULT '[]',
    secret_token VARCHAR(255),
    signature_header VARCHAR(100) DEFAULT 'X-Webhook-Signature',
    content_type VARCHAR(100) DEFAULT 'application/json',
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event processing and message queue
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    event_source VARCHAR(255) NOT NULL,
    integration_instance_id UUID REFERENCES integration_instances(id),
    webhook_endpoint_id UUID REFERENCES webhook_endpoints(id),
    event_data JSONB NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT,
    processing_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data transformation and mapping rules
CREATE TABLE IF NOT EXISTS data_transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transformation_name VARCHAR(255) NOT NULL,
    integration_instance_id UUID REFERENCES integration_instances(id),
    transformation_type VARCHAR(100) NOT NULL, -- 'request', 'response', 'webhook', 'event'
    source_schema JSONB,
    target_schema JSONB,
    transformation_rules JSONB NOT NULL,
    validation_rules JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration health monitoring
CREATE TABLE IF NOT EXISTS integration_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_instance_id UUID REFERENCES integration_instances(id) ON DELETE CASCADE,
    check_type VARCHAR(100) NOT NULL, -- 'ping', 'api_call', 'database_query', 'custom'
    check_config JSONB NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    check_details JSONB,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration dependencies and relationships
CREATE TABLE IF NOT EXISTS integration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_integration_id UUID REFERENCES integration_instances(id) ON DELETE CASCADE,
    dependent_integration_id UUID REFERENCES integration_instances(id) ON DELETE CASCADE,
    dependency_type VARCHAR(100) NOT NULL, -- 'required', 'optional', 'fallback'
    dependency_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_integration_id, dependent_integration_id)
);

-- Integration usage analytics
CREATE TABLE IF NOT EXISTS integration_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_instance_id UUID REFERENCES integration_instances(id),
    date_key INTEGER NOT NULL, -- YYYYMMDD format
    hour_key INTEGER NOT NULL, -- 0-23
    request_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    total_data_transferred_bytes BIGINT DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    cost_estimated DECIMAL(10,4) DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_instance_id, date_key, hour_key)
);

-- Integration alerts and notifications
CREATE TABLE IF NOT EXISTS integration_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_instance_id UUID REFERENCES integration_instances(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    alert_data JSONB,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    acknowledged_by UUID,
    resolved_by UUID,
    notification_sent BOOLEAN DEFAULT false,
    organization_id UUID
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_registry_type ON integration_registry(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_registry_provider ON integration_registry(provider);
CREATE INDEX IF NOT EXISTS idx_integration_instances_status ON integration_instances(status);
CREATE INDEX IF NOT EXISTS idx_integration_instances_registry_id ON integration_instances(registry_id);
CREATE INDEX IF NOT EXISTS idx_api_routes_path ON api_routes(route_path);
CREATE INDEX IF NOT EXISTS idx_api_routes_method ON api_routes(http_method);
CREATE INDEX IF NOT EXISTS idx_integration_executions_instance_id ON integration_executions(integration_instance_id);
CREATE INDEX IF NOT EXISTS idx_integration_executions_executed_at ON integration_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_url ON webhook_endpoints(webhook_url);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_integration_events_scheduled_at ON integration_events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_integration_health_checks_instance_id ON integration_health_checks(integration_instance_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_checks_checked_at ON integration_health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_integration_usage_analytics_date_key ON integration_usage_analytics(date_key);
CREATE INDEX IF NOT EXISTS idx_integration_alerts_status ON integration_alerts(status);
CREATE INDEX IF NOT EXISTS idx_integration_alerts_severity ON integration_alerts(severity);

-- Triggers
CREATE TRIGGER update_integration_registry_updated_at BEFORE UPDATE ON integration_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_instances_updated_at BEFORE UPDATE ON integration_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_routes_updated_at BEFORE UPDATE ON api_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_transformations_updated_at BEFORE UPDATE ON data_transformations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default integration types
INSERT INTO integration_registry (integration_name, integration_type, provider, version, description, connection_config, health_check_config) VALUES
('OpenAI API', 'api', 'OpenAI', '1.0', 'OpenAI GPT API integration for AI capabilities', 
 '{"base_url": "https://api.openai.com/v1", "timeout": 30000, "max_tokens": 4096}',
 '{"endpoint": "/models", "method": "GET", "expected_status": 200, "interval_seconds": 300}'),

('Stripe Payment API', 'api', 'Stripe', '2023-10-16', 'Stripe payment processing integration',
 '{"base_url": "https://api.stripe.com/v1", "timeout": 15000, "api_version": "2023-10-16"}',
 '{"endpoint": "/account", "method": "GET", "expected_status": 200, "interval_seconds": 600}'),

('SendGrid Email API', 'api', 'SendGrid', '3.0', 'SendGrid email delivery service',
 '{"base_url": "https://api.sendgrid.com/v3", "timeout": 10000}',
 '{"endpoint": "/user/profile", "method": "GET", "expected_status": 200, "interval_seconds": 900}'),

('Slack Webhook', 'webhook', 'Slack', '1.0', 'Slack notifications and messaging',
 '{"webhook_url": "", "timeout": 5000, "retry_attempts": 2}',
 '{"method": "POST", "payload": {"text": "Health check"}, "expected_status": 200, "interval_seconds": 1800}'),

('Database Connection', 'database', 'PostgreSQL', '15.0', 'Primary database connection',
 '{"host": "localhost", "port": 5432, "database": "app_db", "ssl": true, "pool_size": 10}',
 '{"query": "SELECT 1", "expected_result": "1", "interval_seconds": 60}')
ON CONFLICT DO NOTHING;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_integration_credentials(credentials TEXT)
RETURNS TEXT AS $$
BEGIN
    -- This would use actual encryption in production
    RETURN encode(digest(credentials, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate webhook URLs
CREATE OR REPLACE FUNCTION generate_webhook_url()
RETURNS TEXT AS $$
BEGIN
    RETURN '/webhooks/' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;
