-- Workflow & Automation Engine
-- Approval workflows, incident response, smart alerting, and integrations

-- Workflow Management Tables
CREATE TABLE IF NOT EXISTS workflow_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'approval', 'incident_response', 'deployment', 'compliance'
    trigger_type VARCHAR(100) NOT NULL, -- 'manual', 'scheduled', 'event_driven', 'api_call'
    trigger_conditions JSONB,
    workflow_definition JSONB NOT NULL, -- JSON representation of workflow steps
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES workflow_templates(id) ON DELETE SET NULL,
    instance_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'running', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    current_step INTEGER DEFAULT 1,
    input_data JSONB,
    output_data JSONB,
    started_by INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_type VARCHAR(100) NOT NULL, -- 'approval', 'notification', 'api_call', 'condition', 'delay'
    step_config JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    assigned_to INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    result_data JSONB,
    error_message TEXT
);

-- Approval System Tables
CREATE TABLE IF NOT EXISTS approval_requests (
    id SERIAL PRIMARY KEY,
    workflow_instance_id INTEGER REFERENCES workflow_instances(id) ON DELETE SET NULL,
    request_type VARCHAR(100) NOT NULL, -- 'model_deployment', 'policy_change', 'budget_approval'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requested_by INTEGER NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    approval_data JSONB,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id INTEGER NOT NULL,
    approver_role VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'delegated'
    decision_date TIMESTAMP,
    comments TEXT,
    delegation_to INTEGER
);

-- Create incident_types table first without foreign key reference
CREATE TABLE IF NOT EXISTS incident_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity_level INTEGER NOT NULL, -- 1-5 scale
    auto_response_enabled BOOLEAN DEFAULT false,
    response_template_id INTEGER, -- Will add foreign key constraint later
    escalation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create incidents table with proper foreign key
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    incident_type_id INTEGER REFERENCES incident_types(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    affected_systems JSONB,
    reported_by INTEGER,
    assigned_to INTEGER,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- Create incident_responses table with proper cascade delete
CREATE TABLE IF NOT EXISTS incident_responses (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    response_type VARCHAR(100) NOT NULL, -- 'automated', 'manual', 'escalation'
    action_taken TEXT NOT NULL,
    response_time_seconds INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    executed_by INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for incident_types after workflow_templates exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incident_types_response_template_id_fkey'
    ) THEN
        ALTER TABLE incident_types 
        ADD CONSTRAINT incident_types_response_template_id_fkey 
        FOREIGN KEY (response_template_id) REFERENCES workflow_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Smart Alerting Tables
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(100) NOT NULL, -- 'threshold', 'anomaly', 'pattern', 'composite'
    conditions JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    notification_channels JSONB, -- email, slack, sms, webhook
    suppression_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES alert_rules(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'suppressed'
    context_data JSONB,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER,
    resolved_at TIMESTAMP,
    resolved_by INTEGER
);

CREATE TABLE IF NOT EXISTS alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL, -- 'email', 'slack', 'sms', 'webhook'
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT
);

-- Integration Hub Tables
CREATE TABLE IF NOT EXISTS integration_connectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'aws', 'azure', 'gcp', 'slack', 'jira', 'github'
    connector_type VARCHAR(100) NOT NULL, -- 'cloud_platform', 'communication', 'devops', 'monitoring'
    description TEXT,
    configuration_schema JSONB,
    authentication_type VARCHAR(50), -- 'api_key', 'oauth', 'service_account'
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_connections (
    id SERIAL PRIMARY KEY,
    connector_id INTEGER REFERENCES integration_connectors(id) ON DELETE CASCADE,
    connection_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    credentials_encrypted TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error', 'testing'
    last_test_at TIMESTAMP,
    last_test_result JSONB,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_usage_logs (
    id SERIAL PRIMARY KEY,
    connection_id INTEGER REFERENCES integration_connections(id) ON DELETE CASCADE,
    operation_type VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'sync'
    operation_details JSONB,
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO workflow_templates (name, description, category, trigger_type, workflow_definition) VALUES
('Model Deployment Approval', 'Multi-stage approval for production model deployments', 'approval', 'manual', 
 '{"steps": [{"type": "approval", "approver_role": "data_scientist"}, {"type": "approval", "approver_role": "security_team"}, {"type": "approval", "approver_role": "operations_manager"}]}'),
('Security Incident Response', 'Automated response to security incidents', 'incident_response', 'event_driven',
 '{"steps": [{"type": "notification", "channels": ["slack", "email"]}, {"type": "api_call", "endpoint": "isolate_system"}, {"type": "approval", "approver_role": "security_lead"}]}'),
('Budget Approval Process', 'Financial approval workflow for budget requests', 'approval', 'manual',
 '{"steps": [{"type": "approval", "approver_role": "manager"}, {"type": "condition", "condition": "amount > 10000"}, {"type": "approval", "approver_role": "director"}]}')
ON CONFLICT DO NOTHING;

INSERT INTO incident_types (name, description, severity_level, auto_response_enabled) VALUES
('Model Performance Degradation', 'AI model accuracy drops below threshold', 3, true),
('Security Breach', 'Unauthorized access detected', 5, true),
('System Outage', 'Critical system unavailable', 4, true),
('Data Quality Issue', 'Data pipeline producing invalid results', 2, false)
ON CONFLICT DO NOTHING;

INSERT INTO alert_rules (name, description, rule_type, conditions, severity, notification_channels) VALUES
('High CPU Usage', 'Alert when CPU usage exceeds 90%', 'threshold', '{"metric": "cpu_usage", "operator": ">", "value": 90}', 'warning', '["email", "slack"]'),
('Model Accuracy Drop', 'Alert when model accuracy drops significantly', 'threshold', '{"metric": "model_accuracy", "operator": "<", "value": 0.85}', 'error', '["email", "slack", "sms"]'),
('Failed Deployments', 'Alert on deployment failures', 'pattern', '{"event": "deployment_failed", "count": 3, "timeframe": "5m"}', 'critical', '["email", "slack", "webhook"]')
ON CONFLICT DO NOTHING;

INSERT INTO integration_connectors (name, provider, connector_type, description, authentication_type) VALUES
('AWS CloudWatch', 'aws', 'monitoring', 'Monitor AWS resources and applications', 'service_account'),
('Slack Notifications', 'slack', 'communication', 'Send notifications to Slack channels', 'oauth'),
('GitHub Actions', 'github', 'devops', 'Trigger and monitor GitHub workflows', 'api_key'),
('Jira Integration', 'jira', 'devops', 'Create and manage Jira tickets', 'api_key'),
('Azure Monitor', 'azure', 'monitoring', 'Monitor Azure resources and applications', 'service_account')
ON CONFLICT DO NOTHING;
