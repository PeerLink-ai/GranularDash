-- Real-Time Monitoring System Database Schema
-- Creates comprehensive monitoring and alerting infrastructure

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    component VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'debug')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    organization_id UUID
);

-- Agent performance monitoring
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    response_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    error_count INTEGER DEFAULT 0,
    throughput_rps DECIMAL(10,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Real-time alerts and incidents
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    component VARCHAR(100),
    agent_id VARCHAR(255),
    user_id UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    auto_resolve BOOLEAN DEFAULT false,
    alert_data JSONB DEFAULT '{}',
    organization_id UUID
);

-- Monitoring thresholds and rules
CREATE TABLE IF NOT EXISTS monitoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    component VARCHAR(100),
    metric_name VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL CHECK (comparison_operator IN ('>', '<', '>=', '<=', '=', '!=')),
    severity VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cooldown_minutes INTEGER DEFAULT 5,
    auto_resolve_minutes INTEGER,
    notification_channels JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    organization_id UUID
);

-- Real-time monitoring sessions
CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    component_filter VARCHAR(100),
    agent_filter VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    websocket_id VARCHAR(255),
    subscription_data JSONB DEFAULT '{}'
);

-- Performance baselines and trends
CREATE TABLE IF NOT EXISTS performance_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(15,4) NOT NULL,
    baseline_type VARCHAR(50) NOT NULL CHECK (baseline_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sample_size INTEGER NOT NULL,
    confidence_interval DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'
);

-- Incident tracking and resolution
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'identified', 'monitoring', 'resolved')),
    affected_components TEXT[],
    affected_agents TEXT[],
    root_cause TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    assigned_to UUID,
    organization_id UUID,
    incident_data JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_recorded_at ON system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_component ON system_health_metrics(component);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_severity ON system_health_metrics(severity);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_recorded_at ON agent_performance_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered_at ON monitoring_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_user_id ON monitoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_is_active ON monitoring_sessions(is_active);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_monitoring_rules_updated_at BEFORE UPDATE ON monitoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default monitoring rules
INSERT INTO monitoring_rules (rule_name, rule_type, component, metric_name, threshold_value, comparison_operator, severity, auto_resolve_minutes) VALUES
('High Response Time', 'performance', 'agent', 'response_time_ms', 5000, '>', 'high', 10),
('Low Success Rate', 'performance', 'agent', 'success_rate', 95, '<', 'high', 15),
('High Error Rate', 'performance', 'agent', 'error_count', 10, '>', 'medium', 5),
('System CPU High', 'system', 'server', 'cpu_usage', 85, '>', 'high', 10),
('System Memory High', 'system', 'server', 'memory_usage', 90, '>', 'critical', 5),
('Database Connection High', 'system', 'database', 'connection_count', 80, '>', 'medium', 10)
ON CONFLICT DO NOTHING;

-- Function to generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT AS $$
DECLARE
    incident_num TEXT;
BEGIN
    incident_num := 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('incident_sequence')::TEXT, 4, '0');
    RETURN incident_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for incident numbers
CREATE SEQUENCE IF NOT EXISTS incident_sequence START 1;
