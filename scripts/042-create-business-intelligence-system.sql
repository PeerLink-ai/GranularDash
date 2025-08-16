-- Business Intelligence & Insights System
-- Cost optimization, ROI tracking, competitive intelligence, and executive reporting

-- Cost Analysis Tables
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_allocated DECIMAL(15,2),
    budget_spent DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS infrastructure_costs (
    id SERIAL PRIMARY KEY,
    cost_center_id INTEGER REFERENCES cost_centers(id),
    resource_type VARCHAR(100) NOT NULL, -- 'compute', 'storage', 'network', 'ai_model'
    resource_name VARCHAR(255) NOT NULL,
    cost_amount DECIMAL(10,2) NOT NULL,
    usage_metrics JSONB, -- CPU hours, storage GB, API calls, etc.
    billing_period DATE NOT NULL,
    provider VARCHAR(100), -- AWS, Azure, GCP, OpenAI, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_optimization_recommendations (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    current_cost DECIMAL(10,2) NOT NULL,
    optimized_cost DECIMAL(10,2) NOT NULL,
    potential_savings DECIMAL(10,2) NOT NULL,
    recommendation_type VARCHAR(100) NOT NULL, -- 'rightsizing', 'scheduling', 'reserved_instances'
    description TEXT NOT NULL,
    implementation_effort VARCHAR(50), -- 'low', 'medium', 'high'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'implemented', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROI Tracking Tables
CREATE TABLE IF NOT EXISTS business_initiatives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    investment_amount DECIMAL(15,2) NOT NULL,
    expected_roi DECIMAL(5,2), -- percentage
    actual_roi DECIMAL(5,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'planning', 'active', 'completed', 'cancelled'
    owner_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roi_metrics (
    id SERIAL PRIMARY KEY,
    initiative_id INTEGER REFERENCES business_initiatives(id),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'revenue', 'cost_savings', 'efficiency_gain'
    measurement_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_forecasts (
    id SERIAL PRIMARY KEY,
    forecast_type VARCHAR(100) NOT NULL, -- 'revenue', 'costs', 'roi'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    forecasted_value DECIMAL(15,2) NOT NULL,
    actual_value DECIMAL(15,2),
    confidence_level DECIMAL(3,2), -- 0.00 to 1.00
    methodology VARCHAR(100), -- 'linear_regression', 'arima', 'neural_network'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitive Intelligence Tables
CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    market_cap DECIMAL(15,2),
    employee_count INTEGER,
    ai_maturity_score DECIMAL(3,2), -- 0.00 to 5.00
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitive_analysis (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER REFERENCES competitors(id),
    analysis_type VARCHAR(100) NOT NULL, -- 'feature_comparison', 'pricing', 'market_share'
    metric_name VARCHAR(255) NOT NULL,
    our_value VARCHAR(500),
    competitor_value VARCHAR(500),
    advantage_score INTEGER, -- -5 to +5 scale
    analysis_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_trends (
    id SERIAL PRIMARY KEY,
    trend_category VARCHAR(100) NOT NULL, -- 'ai_adoption', 'technology', 'regulation'
    trend_name VARCHAR(255) NOT NULL,
    description TEXT,
    impact_score DECIMAL(3,2), -- 0.00 to 5.00
    probability DECIMAL(3,2), -- 0.00 to 1.00
    time_horizon VARCHAR(50), -- 'short_term', 'medium_term', 'long_term'
    source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executive Reporting Tables
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'strategic'
    calculation_method TEXT,
    target_value DECIMAL(15,2),
    unit VARCHAR(50),
    frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly'
    owner_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_measurements (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER REFERENCES kpi_definitions(id),
    measured_value DECIMAL(15,2) NOT NULL,
    measurement_date DATE NOT NULL,
    variance_from_target DECIMAL(15,2),
    trend_direction VARCHAR(20), -- 'up', 'down', 'stable'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS executive_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'ad_hoc'
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    executive_summary TEXT,
    key_insights JSONB,
    recommendations JSONB,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed some initial data
INSERT INTO cost_centers (name, description, budget_allocated) VALUES
('AI Infrastructure', 'Machine learning compute and storage costs', 500000.00),
('Data Platform', 'Data storage, processing, and analytics infrastructure', 300000.00),
('Development Tools', 'Software licenses and development infrastructure', 150000.00),
('Security & Compliance', 'Security tools and compliance monitoring', 200000.00);

INSERT INTO kpi_definitions (name, description, category, target_value, unit, frequency) VALUES
('AI Model ROI', 'Return on investment for AI model deployments', 'financial', 25.00, 'percentage', 'monthly'),
('Infrastructure Cost Efficiency', 'Cost per unit of compute utilized', 'operational', 0.15, 'dollars_per_hour', 'weekly'),
('Time to Market', 'Average time from model development to production', 'operational', 30.00, 'days', 'monthly'),
('Customer Satisfaction Score', 'AI-powered service satisfaction rating', 'strategic', 4.50, 'rating', 'monthly'),
('Model Performance Score', 'Average accuracy across all production models', 'operational', 0.95, 'percentage', 'daily');

INSERT INTO competitors (name, industry, ai_maturity_score) VALUES
('DataRobot', 'AI/ML Platform', 4.5),
('H2O.ai', 'AI/ML Platform', 4.2),
('Databricks', 'Data & AI Platform', 4.7),
('Palantir', 'Data Analytics', 4.0),
('Snowflake', 'Data Cloud', 3.8);
