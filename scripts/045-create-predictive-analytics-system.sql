-- Predictive & Advanced Analytics Engine Database Schema
-- This creates comprehensive tables for forecasting, anomaly detection, root cause analysis, and capacity planning

-- Forecasting Engine Tables
CREATE TABLE IF NOT EXISTS forecasting_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'time_series', 'regression', 'neural_network'
    target_metric VARCHAR(100) NOT NULL, -- 'cost', 'performance', 'usage', 'capacity'
    algorithm VARCHAR(100) NOT NULL, -- 'arima', 'lstm', 'prophet', 'linear_regression'
    parameters JSONB DEFAULT '{}',
    accuracy_score DECIMAL(5,4),
    training_data_start TIMESTAMP,
    training_data_end TIMESTAMP,
    last_trained TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'training', 'deprecated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecasting_predictions (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES forecasting_models(id) ON DELETE CASCADE,
    prediction_date TIMESTAMP NOT NULL,
    predicted_value DECIMAL(15,4) NOT NULL,
    confidence_interval_lower DECIMAL(15,4),
    confidence_interval_upper DECIMAL(15,4),
    actual_value DECIMAL(15,4), -- filled in when actual data becomes available
    prediction_accuracy DECIMAL(5,4), -- calculated when actual value is known
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecasting_scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_id INTEGER REFERENCES forecasting_models(id) ON DELETE CASCADE,
    scenario_parameters JSONB NOT NULL, -- input parameters for what-if analysis
    forecast_horizon_days INTEGER NOT NULL,
    predicted_outcomes JSONB NOT NULL, -- array of predicted values
    confidence_score DECIMAL(5,4),
    business_impact_score DECIMAL(5,4),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly Detection Tables
CREATE TABLE IF NOT EXISTS anomaly_detection_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'isolation_forest', 'one_class_svm', 'autoencoder', 'statistical'
    data_source VARCHAR(100) NOT NULL, -- 'system_metrics', 'user_behavior', 'model_performance'
    features JSONB NOT NULL, -- array of feature names
    sensitivity_threshold DECIMAL(5,4) DEFAULT 0.05,
    training_window_hours INTEGER DEFAULT 168, -- 7 days
    retraining_frequency_hours INTEGER DEFAULT 24,
    last_trained TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detected_anomalies (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES anomaly_detection_models(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    anomaly_score DECIMAL(8,6) NOT NULL, -- 0-1 score indicating severity
    severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    data_point JSONB NOT NULL, -- the actual anomalous data point
    expected_range JSONB, -- what was expected vs what was observed
    affected_systems JSONB, -- array of affected system components
    root_cause_analysis_id INTEGER, -- links to root cause analysis
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomaly_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'seasonal', 'trend', 'spike', 'drift'
    description TEXT,
    detection_rules JSONB NOT NULL, -- rules for identifying this pattern
    frequency_score DECIMAL(5,4), -- how often this pattern occurs
    impact_score DECIMAL(5,4), -- business impact when this pattern occurs
    recommended_actions JSONB, -- array of recommended responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Root Cause Analysis Tables
CREATE TABLE IF NOT EXISTS root_cause_investigations (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(255) NOT NULL, -- links to incident management system
    anomaly_id INTEGER REFERENCES detected_anomalies(id),
    investigation_type VARCHAR(100) NOT NULL, -- 'automated', 'manual', 'hybrid'
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'escalated'
    priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    affected_components JSONB NOT NULL, -- array of affected system components
    timeline_start TIMESTAMP NOT NULL,
    timeline_end TIMESTAMP,
    investigation_steps JSONB DEFAULT '[]', -- array of investigation steps taken
    findings JSONB DEFAULT '{}', -- key findings from the investigation
    root_causes JSONB DEFAULT '[]', -- identified root causes
    confidence_score DECIMAL(5,4), -- confidence in the root cause identification
    resolution_recommendations JSONB DEFAULT '[]',
    estimated_impact JSONB, -- business/technical impact assessment
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investigation_evidence (
    id SERIAL PRIMARY KEY,
    investigation_id INTEGER REFERENCES root_cause_investigations(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100) NOT NULL, -- 'log', 'metric', 'trace', 'user_report', 'system_event'
    source_system VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    evidence_data JSONB NOT NULL,
    relevance_score DECIMAL(5,4), -- how relevant this evidence is to the investigation
    analysis_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cause_effect_relationships (
    id SERIAL PRIMARY KEY,
    parent_cause_id INTEGER REFERENCES root_cause_investigations(id),
    child_effect_id INTEGER REFERENCES root_cause_investigations(id),
    relationship_type VARCHAR(100) NOT NULL, -- 'direct', 'indirect', 'contributing', 'cascading'
    strength DECIMAL(5,4) NOT NULL, -- 0-1 indicating strength of relationship
    time_delay_minutes INTEGER, -- how long between cause and effect
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capacity Planning Tables
CREATE TABLE IF NOT EXISTS capacity_planning_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'compute', 'storage', 'network', 'database', 'ai_inference'
    planning_horizon_days INTEGER NOT NULL,
    growth_model VARCHAR(100) NOT NULL, -- 'linear', 'exponential', 'seasonal', 'ml_based'
    current_utilization DECIMAL(5,4), -- current resource utilization percentage
    target_utilization DECIMAL(5,4), -- target utilization percentage
    safety_buffer DECIMAL(5,4) DEFAULT 0.20, -- 20% safety buffer
    cost_per_unit DECIMAL(10,2),
    scaling_constraints JSONB DEFAULT '{}', -- technical/business constraints
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capacity_recommendations (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES capacity_planning_models(id) ON DELETE CASCADE,
    recommendation_date TIMESTAMP NOT NULL,
    recommendation_type VARCHAR(100) NOT NULL, -- 'scale_up', 'scale_down', 'optimize', 'migrate'
    current_capacity DECIMAL(15,4),
    recommended_capacity DECIMAL(15,4),
    urgency VARCHAR(50) NOT NULL, -- 'immediate', 'within_week', 'within_month', 'planned'
    cost_impact DECIMAL(12,2), -- estimated cost impact
    performance_impact JSONB, -- expected performance changes
    implementation_complexity VARCHAR(50), -- 'low', 'medium', 'high'
    implementation_steps JSONB, -- detailed implementation plan
    business_justification TEXT,
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'implemented'
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    implemented_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_utilization_history (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    resource_identifier VARCHAR(255) NOT NULL, -- specific resource ID/name
    timestamp TIMESTAMP NOT NULL,
    utilization_percentage DECIMAL(5,4) NOT NULL,
    absolute_usage DECIMAL(15,4), -- actual usage in appropriate units
    capacity_limit DECIMAL(15,4), -- maximum capacity
    performance_metrics JSONB, -- additional performance data
    cost_metrics JSONB, -- cost-related metrics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Analytics Aggregation Tables
CREATE TABLE IF NOT EXISTS analytics_insights (
    id SERIAL PRIMARY KEY,
    insight_type VARCHAR(100) NOT NULL, -- 'trend', 'pattern', 'optimization', 'risk'
    category VARCHAR(100) NOT NULL, -- 'performance', 'cost', 'security', 'capacity'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'info', 'low', 'medium', 'high', 'critical'
    confidence_score DECIMAL(5,4) NOT NULL,
    business_impact_score DECIMAL(5,4),
    technical_impact_score DECIMAL(5,4),
    supporting_data JSONB NOT NULL, -- data that supports this insight
    recommended_actions JSONB, -- array of recommended actions
    related_insights JSONB, -- IDs of related insights
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    expires_at TIMESTAMP, -- when this insight becomes stale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictive_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL, -- 'capacity_warning', 'performance_degradation', 'cost_spike', 'anomaly_cluster'
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    predicted_occurrence TIMESTAMP NOT NULL, -- when the issue is predicted to occur
    confidence DECIMAL(5,4) NOT NULL,
    affected_systems JSONB,
    prevention_actions JSONB, -- actions that could prevent the issue
    escalation_rules JSONB, -- when and how to escalate
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'false_positive'
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_forecasting_predictions_model_date ON forecasting_predictions(model_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_severity_status ON detected_anomalies(severity, status);
CREATE INDEX IF NOT EXISTS idx_root_cause_investigations_status_priority ON root_cause_investigations(status, priority);
CREATE INDEX IF NOT EXISTS idx_capacity_recommendations_urgency_status ON capacity_recommendations(urgency, approval_status);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_timestamp ON resource_utilization_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_category_severity ON analytics_insights(category, severity);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_occurrence ON predictive_alerts(predicted_occurrence);

-- Insert sample forecasting models
INSERT INTO forecasting_models (name, model_type, target_metric, algorithm, parameters, accuracy_score) VALUES
('AI Infrastructure Cost Forecasting', 'time_series', 'cost', 'prophet', '{"seasonality": "weekly", "growth": "linear"}', 0.8945),
('System Performance Prediction', 'neural_network', 'performance', 'lstm', '{"layers": 3, "neurons": 128, "dropout": 0.2}', 0.9123),
('Resource Usage Forecasting', 'regression', 'usage', 'random_forest', '{"n_estimators": 100, "max_depth": 10}', 0.8756),
('Capacity Demand Prediction', 'time_series', 'capacity', 'arima', '{"p": 2, "d": 1, "q": 2}', 0.8634);

-- Insert sample anomaly detection models
INSERT INTO anomaly_detection_models (name, model_type, data_source, features, sensitivity_threshold) VALUES
('System Performance Anomaly Detection', 'isolation_forest', 'system_metrics', '["cpu_usage", "memory_usage", "disk_io", "network_io"]', 0.05),
('User Behavior Anomaly Detection', 'one_class_svm', 'user_behavior', '["login_frequency", "session_duration", "api_calls", "data_access"]', 0.03),
('Model Performance Drift Detection', 'statistical', 'model_performance', '["accuracy", "precision", "recall", "f1_score", "latency"]', 0.02),
('Cost Anomaly Detection', 'autoencoder', 'system_metrics', '["compute_cost", "storage_cost", "network_cost", "ai_inference_cost"]', 0.04);

-- Insert sample capacity planning models
INSERT INTO capacity_planning_models (name, resource_type, planning_horizon_days, growth_model, current_utilization, target_utilization, cost_per_unit) VALUES
('Compute Capacity Planning', 'compute', 90, 'exponential', 0.75, 0.80, 0.12),
('Storage Capacity Planning', 'storage', 180, 'linear', 0.68, 0.75, 0.08),
('AI Inference Capacity Planning', 'ai_inference', 60, 'ml_based', 0.82, 0.85, 0.25),
('Database Capacity Planning', 'database', 120, 'seasonal', 0.71, 0.78, 0.15);

-- Insert sample analytics insights
INSERT INTO analytics_insights (insight_type, category, title, description, severity, confidence_score, business_impact_score, technical_impact_score, supporting_data, recommended_actions) VALUES
('trend', 'cost', 'AI Infrastructure Costs Trending Upward', 'AI inference costs have increased 23% over the past 30 days, primarily due to increased model complexity and usage volume.', 'medium', 0.89, 0.75, 0.65, '{"cost_increase": "23%", "primary_driver": "model_complexity", "time_period": "30_days"}', '["optimize_model_efficiency", "implement_caching", "review_usage_patterns"]'),
('pattern', 'performance', 'Weekly Performance Degradation Pattern', 'System performance consistently degrades every Tuesday between 2-4 PM, likely due to batch processing jobs.', 'medium', 0.92, 0.68, 0.82, '{"pattern": "weekly", "day": "tuesday", "time": "14:00-16:00", "degradation": "15%"}', '["reschedule_batch_jobs", "increase_capacity_during_peak", "optimize_job_efficiency"]'),
('optimization', 'capacity', 'Underutilized Compute Resources Identified', 'Analysis shows 35% of compute resources are consistently underutilized, presenting cost optimization opportunities.', 'low', 0.87, 0.85, 0.45, '{"underutilization": "35%", "potential_savings": "$12000/month", "affected_resources": 45}', '["rightsize_instances", "implement_auto_scaling", "consolidate_workloads"]'),
('risk', 'security', 'Anomalous Access Pattern Detected', 'Unusual data access patterns detected from multiple user accounts, potentially indicating coordinated unauthorized access.', 'high', 0.78, 0.92, 0.88, '{"affected_accounts": 8, "unusual_access_volume": "300%", "time_window": "6_hours"}', '["investigate_accounts", "temporary_access_restriction", "enhance_monitoring"]');
