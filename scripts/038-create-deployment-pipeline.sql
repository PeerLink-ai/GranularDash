-- Agent Deployment Pipeline Database Schema
-- This creates the infrastructure for deploying and managing agent deployments

-- Deployment Environments - Different environments where agents can be deployed
CREATE TABLE IF NOT EXISTS deployment_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    environment_type VARCHAR(50) NOT NULL, -- 'cloud', 'edge', 'local', 'serverless', 'kubernetes'
    provider VARCHAR(100) NOT NULL, -- 'aws', 'gcp', 'azure', 'vercel', 'docker', 'kubernetes'
    configuration JSONB NOT NULL DEFAULT '{}',
    resource_limits JSONB DEFAULT '{}', -- CPU, memory, storage limits
    networking_config JSONB DEFAULT '{}',
    security_config JSONB DEFAULT '{}',
    cost_config JSONB DEFAULT '{}', -- Pricing information
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployment Pipelines - CI/CD pipeline configurations
CREATE TABLE IF NOT EXISTS deployment_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pipeline_config JSONB NOT NULL DEFAULT '{}',
    trigger_config JSONB DEFAULT '{}', -- What triggers deployments
    build_config JSONB DEFAULT '{}', -- Build steps and configuration
    test_config JSONB DEFAULT '{}', -- Testing configuration
    deployment_stages JSONB DEFAULT '[]', -- Ordered list of deployment stages
    rollback_config JSONB DEFAULT '{}',
    notification_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Enhanced Agent Deployments table (extending the existing one)
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES deployment_pipelines(id);
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES deployment_environments(id);
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS build_id VARCHAR(255);
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS container_image VARCHAR(500);
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS resource_allocation JSONB DEFAULT '{}';
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS scaling_config JSONB DEFAULT '{}';
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS traffic_config JSONB DEFAULT '{}';

-- Deployment Builds - Track build processes
CREATE TABLE IF NOT EXISTS deployment_builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES created_agents(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES deployment_pipelines(id),
    build_number INTEGER NOT NULL,
    commit_sha VARCHAR(255),
    branch VARCHAR(255) DEFAULT 'main',
    build_config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'testing', 'completed', 'failed', 'cancelled')),
    build_logs TEXT,
    test_results JSONB DEFAULT '{}',
    artifacts JSONB DEFAULT '{}', -- Built artifacts (container images, packages, etc.)
    build_duration_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    triggered_by UUID REFERENCES users(id)
);

-- Deployment Health Checks - Monitor deployment health
CREATE TABLE IF NOT EXISTS deployment_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL, -- 'http', 'tcp', 'custom', 'readiness', 'liveness'
    check_config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'unknown' CHECK (status IN ('healthy', 'unhealthy', 'unknown', 'warning')),
    response_time_ms INTEGER,
    status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployment Scaling Events - Track auto-scaling events
CREATE TABLE IF NOT EXISTS deployment_scaling_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'scale_up', 'scale_down', 'scale_out', 'scale_in'
    trigger_reason VARCHAR(100) NOT NULL, -- 'cpu_high', 'memory_high', 'request_volume', 'manual'
    previous_config JSONB NOT NULL,
    new_config JSONB NOT NULL,
    metrics_snapshot JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployment Traffic Routing - Manage traffic routing and load balancing
CREATE TABLE IF NOT EXISTS deployment_traffic_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
    routing_type VARCHAR(50) NOT NULL, -- 'blue_green', 'canary', 'a_b_test', 'weighted'
    routing_config JSONB NOT NULL DEFAULT '{}',
    traffic_percentage INTEGER DEFAULT 100 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    target_deployment_id UUID REFERENCES agent_deployments(id), -- For blue-green deployments
    routing_rules JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployment Rollbacks - Track rollback operations
CREATE TABLE IF NOT EXISTS deployment_rollbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES agent_deployments(id) ON DELETE CASCADE,
    target_deployment_id UUID NOT NULL REFERENCES agent_deployments(id), -- What we're rolling back to
    rollback_reason VARCHAR(255) NOT NULL,
    rollback_config JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    rollback_steps JSONB DEFAULT '[]',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    initiated_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployment_environments_type ON deployment_environments(environment_type);
CREATE INDEX IF NOT EXISTS idx_deployment_pipelines_agent_id ON deployment_pipelines(agent_id);
CREATE INDEX IF NOT EXISTS idx_deployment_builds_agent_id ON deployment_builds(agent_id);
CREATE INDEX IF NOT EXISTS idx_deployment_builds_status ON deployment_builds(status);
CREATE INDEX IF NOT EXISTS idx_deployment_health_checks_deployment_id ON deployment_health_checks(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_health_checks_checked_at ON deployment_health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_deployment_scaling_events_deployment_id ON deployment_scaling_events(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_traffic_routing_deployment_id ON deployment_traffic_routing(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_rollbacks_deployment_id ON deployment_rollbacks(deployment_id);

-- Insert default deployment environments
INSERT INTO deployment_environments (name, display_name, environment_type, provider, configuration, resource_limits, cost_config) VALUES
('vercel-serverless', 'Vercel Serverless', 'serverless', 'vercel', 
 '{"runtime": "nodejs18.x", "region": "us-east-1", "timeout": 30}',
 '{"memory": "1024mb", "timeout": "30s", "concurrent_executions": 1000}',
 '{"requests": 0.0000002, "gb_hours": 0.0000185}'),

('aws-lambda', 'AWS Lambda', 'serverless', 'aws',
 '{"runtime": "nodejs18.x", "region": "us-east-1", "timeout": 900}',
 '{"memory": "3008mb", "timeout": "15m", "concurrent_executions": 1000}',
 '{"requests": 0.0000002, "gb_seconds": 0.0000166667}'),

('docker-cloud', 'Docker Cloud', 'cloud', 'docker',
 '{"base_image": "node:18-alpine", "port": 3000}',
 '{"cpu": "1", "memory": "2gb", "storage": "10gb"}',
 '{"cpu_hour": 0.05, "memory_gb_hour": 0.01, "storage_gb_month": 0.1}'),

('kubernetes', 'Kubernetes Cluster', 'kubernetes', 'kubernetes',
 '{"namespace": "default", "service_type": "ClusterIP"}',
 '{"cpu": "500m", "memory": "1gi", "replicas": 3}',
 '{"cpu_hour": 0.03, "memory_gb_hour": 0.008}'),

('edge-compute', 'Edge Computing', 'edge', 'cloudflare',
 '{"runtime": "v8", "region": "global"}',
 '{"memory": "128mb", "cpu_time": "50ms", "requests_per_minute": 1000}',
 '{"requests": 0.0000005, "cpu_time": 0.000002}');

-- Create triggers for updated_at
CREATE TRIGGER update_deployment_environments_updated_at BEFORE UPDATE ON deployment_environments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployment_pipelines_updated_at BEFORE UPDATE ON deployment_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployment_traffic_routing_updated_at BEFORE UPDATE ON deployment_traffic_routing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
