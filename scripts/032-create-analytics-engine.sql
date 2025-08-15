-- Advanced Analytics Engine Database Schema
-- Creates comprehensive analytics and business intelligence infrastructure

-- Analytics data warehouse tables
CREATE TABLE IF NOT EXISTS analytics_fact_agent_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    organization_id UUID,
    date_key INTEGER NOT NULL, -- YYYYMMDD format
    hour_key INTEGER NOT NULL, -- 0-23
    requests_count INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    response_time_avg DECIMAL(10,2),
    success_rate DECIMAL(5,2),
    error_count INTEGER DEFAULT 0,
    cost_estimated DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictive analytics models
CREATE TABLE IF NOT EXISTS analytics_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'anomaly_detection', 'usage_prediction', 'performance_forecast'
    model_version VARCHAR(50) NOT NULL,
    training_data_period INTERVAL NOT NULL,
    accuracy_score DECIMAL(5,4),
    model_parameters JSONB NOT NULL,
    feature_importance JSONB,
    is_active BOOLEAN DEFAULT true,
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_prediction_at TIMESTAMP,
    created_by UUID,
    metadata JSONB DEFAULT '{}'
);

-- Analytics insights and recommendations
CREATE TABLE IF NOT EXISTS analytics_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'performance', 'cost', 'usage', 'anomaly'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    confidence_score DECIMAL(5,4) NOT NULL,
    affected_entities JSONB, -- agents, users, components affected
    recommendations JSONB, -- suggested actions
    insight_data JSONB NOT NULL,
    user_id UUID,
    organization_id UUID,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom analytics reports and dashboards
CREATE TABLE IF NOT EXISTS analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'standard', 'custom', 'scheduled'
    description TEXT,
    query_definition JSONB NOT NULL,
    visualization_config JSONB,
    filters JSONB DEFAULT '{}',
    schedule_config JSONB, -- for scheduled reports
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    organization_id UUID,
    last_generated_at TIMESTAMP,
    generation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics KPIs and metrics definitions
CREATE TABLE IF NOT EXISTS analytics_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name VARCHAR(255) NOT NULL,
    kpi_category VARCHAR(100) NOT NULL,
    description TEXT,
    calculation_formula TEXT NOT NULL,
    target_value DECIMAL(15,4),
    warning_threshold DECIMAL(15,4),
    critical_threshold DECIMAL(15,4),
    unit VARCHAR(50),
    frequency VARCHAR(50) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
    is_active BOOLEAN DEFAULT true,
    organization_id UUID,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI historical values
CREATE TABLE IF NOT EXISTS analytics_kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID REFERENCES analytics_kpis(id) ON DELETE CASCADE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    calculated_value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    variance_percent DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('critical', 'warning', 'normal', 'excellent')),
    calculation_metadata JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly detection results
CREATE TABLE IF NOT EXISTS analytics_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES analytics_models(id),
    entity_type VARCHAR(100) NOT NULL, -- 'agent', 'user', 'system'
    entity_id VARCHAR(255) NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL,
    anomaly_score DECIMAL(8,4) NOT NULL,
    expected_value DECIMAL(15,4),
    actual_value DECIMAL(15,4),
    deviation_percent DECIMAL(8,2),
    context_data JSONB,
    is_confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID,
    confirmed_at TIMESTAMP,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics data processing jobs
CREATE TABLE IF NOT EXISTS analytics_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL, -- 'etl', 'model_training', 'prediction', 'report_generation'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    job_config JSONB NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    result_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_fact_agent_usage_date_key ON analytics_fact_agent_usage(date_key);
CREATE INDEX IF NOT EXISTS idx_analytics_fact_agent_usage_agent_id ON analytics_fact_agent_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_analytics_fact_agent_usage_user_id ON analytics_fact_agent_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_category ON analytics_insights(category);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_severity ON analytics_insights(severity);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_created_at ON analytics_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_kpi_values_kpi_id ON analytics_kpi_values(kpi_id);
CREATE INDEX IF NOT EXISTS idx_analytics_kpi_values_period_start ON analytics_kpi_values(period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_anomalies_entity ON analytics_anomalies(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_anomalies_detected_at ON analytics_anomalies(detected_at);

-- Triggers
CREATE TRIGGER update_analytics_reports_updated_at BEFORE UPDATE ON analytics_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default KPIs
INSERT INTO analytics_kpis (kpi_name, kpi_category, description, calculation_formula, target_value, warning_threshold, critical_threshold, unit, frequency) VALUES
('Agent Response Time', 'performance', 'Average response time across all agents', 'AVG(response_time_ms)', 2000, 3000, 5000, 'ms', 'hourly'),
('Agent Success Rate', 'performance', 'Percentage of successful agent requests', 'AVG(success_rate)', 98, 95, 90, '%', 'hourly'),
('Daily Active Agents', 'usage', 'Number of agents used per day', 'COUNT(DISTINCT agent_id)', 10, 5, 2, 'count', 'daily'),
('Token Consumption Rate', 'cost', 'Tokens consumed per hour', 'SUM(tokens_consumed)', 50000, 75000, 100000, 'tokens', 'hourly'),
('Error Rate', 'reliability', 'Percentage of requests resulting in errors', 'SUM(error_count) / SUM(requests_count) * 100', 1, 3, 5, '%', 'hourly'),
('Cost Per Request', 'cost', 'Average cost per agent request', 'SUM(cost_estimated) / SUM(requests_count)', 0.01, 0.05, 0.10, 'USD', 'daily')
ON CONFLICT DO NOTHING;

-- Insert default analytics models
INSERT INTO analytics_models (model_name, model_type, model_version, training_data_period, model_parameters) VALUES
('Agent Performance Anomaly Detector', 'anomaly_detection', '1.0', '30 days', '{"algorithm": "isolation_forest", "contamination": 0.1, "features": ["response_time", "success_rate", "error_count"]}'),
('Usage Prediction Model', 'usage_prediction', '1.0', '90 days', '{"algorithm": "linear_regression", "features": ["historical_usage", "day_of_week", "hour_of_day", "user_activity"]}'),
('Cost Forecast Model', 'cost_prediction', '1.0', '60 days', '{"algorithm": "arima", "seasonal_periods": [7, 30], "features": ["token_usage", "request_volume", "agent_types"]}'
ON CONFLICT DO NOTHING;
