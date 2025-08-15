-- Ensure compliance_reports table exists with correct schema
CREATE TABLE IF NOT EXISTS compliance_reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'ad-hoc',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    content JSONB DEFAULT '{}',
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_compliance_reports_organization ON compliance_reports(organization);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON compliance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);

-- Ensure subscriptions and subscription_plans tables exist for user-subscription endpoint
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add subscription fields to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

-- Insert default subscription plans if none exist
INSERT INTO subscription_plans (name, amount, features) 
SELECT 'Free', 0.00, '["Basic Dashboard", "Limited Agents"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Free');

INSERT INTO subscription_plans (name, amount, features) 
SELECT 'Pro', 29.99, '["Full Dashboard", "Unlimited Agents", "Advanced Analytics"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro');

INSERT INTO subscription_plans (name, amount, features) 
SELECT 'Enterprise', 99.99, '["Everything in Pro", "Custom Integrations", "Priority Support"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise');
