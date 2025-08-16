-- MLOps System: Model Registry, A/B Testing, Drift Detection, Feature Store

-- Model Registry Tables
CREATE TABLE IF NOT EXISTS model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'classification', 'regression', 'llm', 'embedding', etc.
    framework VARCHAR(100), -- 'pytorch', 'tensorflow', 'huggingface', etc.
    model_size_mb NUMERIC,
    model_artifact_url TEXT,
    model_config JSONB,
    performance_metrics JSONB,
    training_dataset_info JSONB,
    validation_metrics JSONB,
    model_signature JSONB, -- input/output schema
    tags JSONB,
    description TEXT,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'staging', 'production', 'archived'
    is_active BOOLEAN DEFAULT true,
    parent_model_id UUID REFERENCES model_registry(id), -- for model lineage
    UNIQUE(model_name, model_version, organization_id)
);

-- Model Deployments
CREATE TABLE IF NOT EXISTS model_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_registry(id),
    deployment_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL, -- 'staging', 'production', 'canary'
    endpoint_url TEXT,
    deployment_config JSONB,
    resource_allocation JSONB, -- CPU, memory, GPU requirements
    auto_scaling_config JSONB,
    health_check_config JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'deploying', 'active', 'failed', 'stopped'
    deployed_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    deployment_logs JSONB,
    performance_sla JSONB, -- latency, throughput targets
    cost_tracking JSONB,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    success_metrics JSONB, -- what metrics to track
    control_model_id UUID REFERENCES model_registry(id),
    treatment_model_id UUID REFERENCES model_registry(id),
    traffic_split JSONB, -- percentage allocation
    target_audience JSONB, -- user segments, filters
    experiment_config JSONB,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    statistical_significance NUMERIC,
    confidence_level NUMERIC DEFAULT 0.95,
    minimum_sample_size INTEGER,
    current_sample_size INTEGER DEFAULT 0,
    results JSONB,
    winner_model_id UUID REFERENCES model_registry(id),
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id),
    model_variant VARCHAR(50), -- 'control' or 'treatment'
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    input_data JSONB,
    model_output JSONB,
    response_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    user_feedback JSONB,
    conversion_event BOOLEAN DEFAULT false,
    business_metrics JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Model Drift Detection
CREATE TABLE IF NOT EXISTS drift_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_name VARCHAR(255) NOT NULL,
    model_id UUID REFERENCES model_registry(id),
    deployment_id UUID REFERENCES model_deployments(id),
    drift_type VARCHAR(50) NOT NULL, -- 'data_drift', 'concept_drift', 'prediction_drift'
    monitoring_config JSONB,
    baseline_data JSONB, -- reference distribution
    detection_method VARCHAR(100), -- 'statistical_test', 'ml_based', 'rule_based'
    threshold_config JSONB,
    alert_config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_check TIMESTAMP WITH TIME ZONE,
    next_check TIMESTAMP WITH TIME ZONE,
    check_frequency_minutes INTEGER DEFAULT 60,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drift Detection Results
CREATE TABLE IF NOT EXISTS drift_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID REFERENCES drift_monitors(id),
    detection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    drift_detected BOOLEAN,
    drift_score NUMERIC,
    drift_magnitude VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    affected_features JSONB,
    statistical_tests JSONB,
    drift_details JSONB,
    recommended_actions JSONB,
    alert_sent BOOLEAN DEFAULT false,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    metadata JSONB
);

-- Feature Store
CREATE TABLE IF NOT EXISTS feature_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    feature_schema JSONB, -- column definitions
    data_source JSONB, -- connection info
    transformation_logic JSONB,
    refresh_schedule JSONB,
    data_quality_rules JSONB,
    tags JSONB,
    owner_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'deprecated', 'archived'
    version INTEGER DEFAULT 1
);

-- Feature Definitions
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name VARCHAR(255) NOT NULL,
    feature_group_id UUID REFERENCES feature_groups(id),
    data_type VARCHAR(50), -- 'numeric', 'categorical', 'text', 'datetime', 'boolean'
    description TEXT,
    computation_logic TEXT,
    default_value JSONB,
    validation_rules JSONB,
    business_meaning TEXT,
    feature_importance NUMERIC,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    tags JSONB
);

-- Feature Usage Tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES features(id),
    model_id UUID REFERENCES model_registry(id),
    usage_type VARCHAR(50), -- 'training', 'inference', 'validation'
    usage_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feature_value JSONB,
    context JSONB,
    user_id UUID REFERENCES users(id)
);

-- Model Lineage Tracking
CREATE TABLE IF NOT EXISTS model_lineage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_registry(id),
    parent_model_id UUID REFERENCES model_registry(id),
    relationship_type VARCHAR(50), -- 'derived_from', 'fine_tuned_from', 'ensemble_of', 'distilled_from'
    transformation_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model Approval Workflows
CREATE TABLE IF NOT EXISTS model_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_registry(id),
    approval_stage VARCHAR(50), -- 'technical_review', 'business_review', 'compliance_review', 'final_approval'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'requires_changes'
    reviewer_id UUID REFERENCES users(id),
    review_notes TEXT,
    checklist_items JSONB,
    approval_criteria JSONB,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_registry_org_status ON model_registry(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_model_deployments_model_env ON model_deployments(model_id, environment);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status, organization_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_experiment ON ab_test_results(experiment_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_drift_monitors_model ON drift_monitors(model_id, is_active);
CREATE INDEX IF NOT EXISTS idx_drift_detections_monitor_time ON drift_detections(monitor_id, detection_timestamp);
CREATE INDEX IF NOT EXISTS idx_features_group ON features(feature_group_id, is_active);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_time ON feature_usage(feature_id, usage_timestamp);
