-- Automated Assessment Engine Database Schema
-- Creates comprehensive automated evaluation and testing infrastructure

-- Assessment templates and criteria
CREATE TABLE IF NOT EXISTS assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL, -- 'performance', 'security', 'compliance', 'quality'
    description TEXT,
    assessment_criteria JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    pass_threshold DECIMAL(5,2) DEFAULT 70.00,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automated assessments
CREATE TABLE IF NOT EXISTS automated_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES assessment_templates(id),
    target_type VARCHAR(100) NOT NULL, -- 'agent', 'system', 'user', 'organization'
    target_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    overall_score DECIMAL(5,2),
    pass_status BOOLEAN,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    assessment_config JSONB DEFAULT '{}',
    results_summary JSONB,
    user_id UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual assessment results
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES automated_assessments(id) ON DELETE CASCADE,
    criterion_name VARCHAR(255) NOT NULL,
    criterion_category VARCHAR(100) NOT NULL,
    test_name VARCHAR(255),
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,4) DEFAULT 1.0000,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'info')),
    details TEXT,
    evidence JSONB,
    recommendations JSONB,
    execution_time_ms INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automated test suites
CREATE TABLE IF NOT EXISTS test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_name VARCHAR(255) NOT NULL,
    suite_type VARCHAR(100) NOT NULL, -- 'functional', 'performance', 'security', 'integration'
    description TEXT,
    test_cases JSONB NOT NULL,
    execution_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test execution results
CREATE TABLE IF NOT EXISTS test_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id UUID REFERENCES test_suites(id),
    assessment_id UUID REFERENCES automated_assessments(id),
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    results_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benchmarking standards and baselines
CREATE TABLE IF NOT EXISTS benchmark_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_name VARCHAR(255) NOT NULL,
    standard_type VARCHAR(100) NOT NULL, -- 'industry', 'internal', 'regulatory'
    category VARCHAR(100) NOT NULL,
    benchmark_values JSONB NOT NULL,
    version VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments and vulnerability scans
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES automated_assessments(id),
    risk_category VARCHAR(100) NOT NULL,
    risk_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    likelihood VARCHAR(20) NOT NULL CHECK (likelihood IN ('very_high', 'high', 'medium', 'low', 'very_low')),
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('very_high', 'high', 'medium', 'low', 'very_low')),
    risk_score DECIMAL(5,2) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_components JSONB,
    mitigation_strategies JSONB,
    remediation_priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'mitigated', 'accepted', 'closed')),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mitigated_at TIMESTAMP
);

-- Compliance checks and regulatory assessments
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES automated_assessments(id),
    regulation_name VARCHAR(255) NOT NULL,
    requirement_id VARCHAR(100) NOT NULL,
    requirement_description TEXT NOT NULL,
    compliance_status VARCHAR(50) NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'not_applicable')),
    evidence JSONB,
    gaps_identified JSONB,
    remediation_actions JSONB,
    compliance_score DECIMAL(5,2),
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_check_due TIMESTAMP
);

-- Assessment scheduling and automation
CREATE TABLE IF NOT EXISTS assessment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES assessment_templates(id),
    target_type VARCHAR(100) NOT NULL,
    target_filter JSONB, -- Criteria for selecting targets
    schedule_config JSONB NOT NULL, -- Cron-like scheduling
    is_active BOOLEAN DEFAULT true,
    last_execution TIMESTAMP,
    next_execution TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automated_assessments_target ON automated_assessments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_automated_assessments_status ON automated_assessments(status);
CREATE INDEX IF NOT EXISTS idx_automated_assessments_completed_at ON automated_assessments(completed_at);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_criterion_category ON assessment_results(criterion_category);
CREATE INDEX IF NOT EXISTS idx_test_executions_suite_id ON test_executions(suite_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_severity ON risk_assessments(severity);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_compliance_status ON compliance_checks(compliance_status);

-- Triggers
CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON assessment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_suites_updated_at BEFORE UPDATE ON test_suites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default assessment templates
INSERT INTO assessment_templates (template_name, template_type, description, assessment_criteria, scoring_weights, pass_threshold) VALUES
('Agent Performance Assessment', 'performance', 'Comprehensive performance evaluation for AI agents', 
 '{"response_time": {"max_acceptable": 3000, "weight": 0.3}, "success_rate": {"min_acceptable": 95, "weight": 0.4}, "error_rate": {"max_acceptable": 5, "weight": 0.2}, "throughput": {"min_acceptable": 10, "weight": 0.1}}',
 '{"response_time": 0.3, "success_rate": 0.4, "error_rate": 0.2, "throughput": 0.1}', 80.00),

('Security Assessment', 'security', 'Security vulnerability and compliance assessment',
 '{"authentication": {"required": true, "weight": 0.25}, "encryption": {"required": true, "weight": 0.25}, "access_control": {"required": true, "weight": 0.2}, "audit_logging": {"required": true, "weight": 0.15}, "vulnerability_scan": {"max_critical": 0, "weight": 0.15}}',
 '{"authentication": 0.25, "encryption": 0.25, "access_control": 0.2, "audit_logging": 0.15, "vulnerability_scan": 0.15}', 85.00),

('Quality Assurance Assessment', 'quality', 'Code quality and best practices assessment',
 '{"code_coverage": {"min_acceptable": 80, "weight": 0.3}, "code_quality": {"min_score": 7, "weight": 0.25}, "documentation": {"min_coverage": 70, "weight": 0.2}, "testing": {"min_tests": 50, "weight": 0.25}}',
 '{"code_coverage": 0.3, "code_quality": 0.25, "documentation": 0.2, "testing": 0.25}', 75.00),

('Compliance Assessment', 'compliance', 'Regulatory compliance and governance assessment',
 '{"data_protection": {"gdpr_compliant": true, "weight": 0.3}, "financial_regulations": {"sox_compliant": true, "weight": 0.25}, "industry_standards": {"iso27001": true, "weight": 0.2}, "audit_trail": {"complete": true, "weight": 0.25}}',
 '{"data_protection": 0.3, "financial_regulations": 0.25, "industry_standards": 0.2, "audit_trail": 0.25}', 90.00)
ON CONFLICT DO NOTHING;

-- Insert default test suites
INSERT INTO test_suites (suite_name, suite_type, description, test_cases) VALUES
('Agent Functional Tests', 'functional', 'Basic functionality tests for AI agents',
 '{"connection_test": {"timeout": 5000, "expected_status": "success"}, "authentication_test": {"test_invalid_key": true, "test_valid_key": true}, "response_format_test": {"validate_json": true, "validate_schema": true}, "error_handling_test": {"test_rate_limits": true, "test_invalid_requests": true}}'),

('Performance Load Tests', 'performance', 'Performance and load testing for agents',
 '{"load_test": {"concurrent_requests": 10, "duration_seconds": 60, "max_response_time": 3000}, "stress_test": {"max_concurrent": 50, "ramp_up_time": 30}, "endurance_test": {"duration_minutes": 30, "steady_load": 5}}'),

('Security Penetration Tests', 'security', 'Security testing and vulnerability assessment',
 '{"injection_tests": {"sql_injection": true, "xss_injection": true, "command_injection": true}, "authentication_bypass": {"test_weak_passwords": true, "test_session_hijacking": true}, "data_exposure": {"test_sensitive_data_leaks": true, "test_error_information_disclosure": true}}'),

('Integration Tests', 'integration', 'Integration testing with external systems',
 '{"database_integration": {"connection_test": true, "transaction_test": true}, "api_integration": {"external_api_calls": true, "webhook_handling": true}, "service_integration": {"microservice_communication": true, "message_queue_handling": true}}')
ON CONFLICT DO NOTHING;

-- Insert benchmark standards
INSERT INTO benchmark_standards (standard_name, standard_type, category, benchmark_values, version, effective_date, source) VALUES
('AI Agent Performance Standards', 'industry', 'performance', 
 '{"response_time_p95": 2000, "success_rate_min": 99.5, "error_rate_max": 0.5, "availability_min": 99.9}', 
 '1.0', CURRENT_DATE, 'Industry Best Practices'),

('Security Baseline Standards', 'industry', 'security',
 '{"encryption_strength_min": 256, "password_complexity_score": 8, "session_timeout_max": 3600, "failed_login_attempts_max": 5}',
 '1.0', CURRENT_DATE, 'NIST Cybersecurity Framework'),

('Quality Metrics Standards', 'industry', 'quality',
 '{"code_coverage_min": 85, "cyclomatic_complexity_max": 10, "maintainability_index_min": 70, "technical_debt_ratio_max": 5}',
 '1.0', CURRENT_DATE, 'Software Engineering Institute')
ON CONFLICT DO NOTHING;
