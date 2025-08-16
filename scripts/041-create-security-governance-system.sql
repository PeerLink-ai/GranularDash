-- Enhanced Security & Governance Center
-- AI Ethics Dashboard, Compliance Scanning, Data Privacy, Threat Intelligence

-- AI Ethics and Bias Detection
CREATE TABLE IF NOT EXISTS ai_ethics_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_registry(id),
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(100), -- 'bias_detection', 'fairness_audit', 'explainability_test'
    dataset_used JSONB,
    bias_metrics JSONB, -- demographic parity, equalized odds, etc.
    fairness_scores JSONB,
    protected_attributes JSONB, -- race, gender, age, etc.
    bias_detected BOOLEAN DEFAULT false,
    severity_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    recommendations JSONB,
    mitigation_actions JSONB,
    assessment_results JSONB,
    conducted_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'in_progress', 'completed', 'failed'
);

-- Automated Compliance Scanning
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_name VARCHAR(255) NOT NULL, -- 'GDPR', 'CCPA', 'HIPAA', 'SOX', 'PCI-DSS'
    framework_version VARCHAR(50),
    description TEXT,
    requirements JSONB, -- detailed compliance requirements
    assessment_criteria JSONB,
    mandatory_controls JSONB,
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_name VARCHAR(255) NOT NULL,
    framework_id UUID REFERENCES compliance_frameworks(id),
    target_type VARCHAR(100), -- 'model', 'dataset', 'system', 'process'
    target_id VARCHAR(255),
    scan_config JSONB,
    automated_checks JSONB,
    manual_reviews JSONB,
    scan_results JSONB,
    compliance_score NUMERIC, -- 0-100
    violations_found INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    recommendations JSONB,
    next_scan_due TIMESTAMP WITH TIME ZONE,
    scan_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly'
    conducted_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled' -- 'scheduled', 'running', 'completed', 'failed'
);

-- Data Privacy and Protection
CREATE TABLE IF NOT EXISTS data_privacy_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_name VARCHAR(255) NOT NULL,
    data_source VARCHAR(255),
    data_classification JSONB, -- PII, sensitive, public, etc.
    privacy_risks JSONB,
    data_lineage JSONB,
    retention_policies JSONB,
    access_controls JSONB,
    encryption_status JSONB,
    anonymization_techniques JSONB,
    consent_management JSONB,
    right_to_erasure_compliance BOOLEAN DEFAULT false,
    data_portability_compliance BOOLEAN DEFAULT false,
    privacy_score NUMERIC, -- 0-100
    gaps_identified JSONB,
    remediation_plan JSONB,
    assessed_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft'
);

-- Threat Intelligence and Security
CREATE TABLE IF NOT EXISTS security_threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_id VARCHAR(255) UNIQUE NOT NULL,
    threat_name VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100), -- 'model_poisoning', 'adversarial_attack', 'data_breach', 'insider_threat'
    severity_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    threat_description TEXT,
    attack_vectors JSONB,
    indicators_of_compromise JSONB,
    affected_systems JSONB,
    mitigation_strategies JSONB,
    detection_rules JSONB,
    threat_source VARCHAR(100), -- 'internal', 'external', 'third_party'
    confidence_level NUMERIC, -- 0-100
    threat_intelligence_feeds JSONB,
    first_detected TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id),
    status VARCHAR(50) DEFAULT 'active' -- 'active', 'mitigated', 'false_positive', 'archived'
);

CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id VARCHAR(255) UNIQUE NOT NULL,
    incident_title VARCHAR(255) NOT NULL,
    incident_type VARCHAR(100), -- 'security_breach', 'model_attack', 'data_leak', 'unauthorized_access'
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'contained', 'resolved', 'closed'
    description TEXT,
    affected_assets JSONB,
    impact_assessment JSONB,
    timeline JSONB,
    evidence JSONB,
    response_actions JSONB,
    lessons_learned TEXT,
    root_cause_analysis JSONB,
    assigned_to UUID REFERENCES users(id),
    reported_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    detected_at TIMESTAMP WITH TIME ZONE,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance Policy Engine
CREATE TABLE IF NOT EXISTS governance_policy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    policy_category VARCHAR(100), -- 'data_governance', 'model_governance', 'security', 'compliance'
    template_description TEXT,
    policy_rules JSONB,
    enforcement_mechanisms JSONB,
    violation_actions JSONB,
    compliance_frameworks JSONB, -- which frameworks this supports
    template_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automated_policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id VARCHAR(255) UNIQUE NOT NULL,
    policy_id UUID REFERENCES governance_policies(id),
    violation_type VARCHAR(100),
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    affected_resource_type VARCHAR(100),
    affected_resource_id VARCHAR(255),
    detection_method VARCHAR(100), -- 'automated_scan', 'real_time_monitoring', 'manual_review'
    violation_details JSONB,
    evidence JSONB,
    auto_remediation_attempted BOOLEAN DEFAULT false,
    remediation_actions JSONB,
    assigned_to UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'open' -- 'open', 'acknowledged', 'in_progress', 'resolved', 'false_positive'
);

-- Security Metrics and KPIs
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_category VARCHAR(100), -- 'threat_detection', 'compliance', 'privacy', 'ethics'
    metric_value NUMERIC,
    metric_unit VARCHAR(50),
    target_value NUMERIC,
    threshold_warning NUMERIC,
    threshold_critical NUMERIC,
    measurement_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    data_source VARCHAR(255),
    calculation_method TEXT,
    organization_id UUID REFERENCES organizations(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_ethics_model_org ON ai_ethics_assessments(model_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scans_framework ON compliance_scans(framework_id, status);
CREATE INDEX IF NOT EXISTS idx_privacy_assessments_org ON data_privacy_assessments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_severity ON security_threat_intelligence(severity_level, status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status, severity, organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON automated_policy_violations(status, severity, organization_id);
CREATE INDEX IF NOT EXISTS idx_security_metrics_category ON security_metrics(metric_category, recorded_at);
