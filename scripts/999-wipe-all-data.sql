-- Script to wipe all data from database tables while preserving structure
-- This script deletes all data from all tables in the correct order to handle foreign key constraints

-- Removed session_replication_role commands that require superuser privileges

-- Delete from tables in reverse dependency order to avoid foreign key violations
-- Start with tables that reference other tables

-- User and session related cleanup
DELETE FROM user_sessions;
DELETE FROM user_permissions;
DELETE FROM user_preferences;
DELETE FROM user_recent_activity;
DELETE FROM user_themes;
DELETE FROM user_favorites;
DELETE FROM user_feedback;
DELETE FROM user_competencies;

-- Agent and AI related cleanup
DELETE FROM agent_activity_stream;
DELETE FROM agent_governance_logs;
DELETE FROM agent_logs;
DELETE FROM agent_metrics;
DELETE FROM agent_performance_metrics;
DELETE FROM agent_trial_metrics;
DELETE FROM agent_trial_notifications;
DELETE FROM agent_trial_usage;
DELETE FROM agent_trials;
DELETE FROM ai_messages;
DELETE FROM ai_conversations;
DELETE FROM ai_query_cache;
DELETE FROM ai_thought_process_logs;
DELETE FROM ai_thought_relationships;
DELETE FROM lineage_mapping;
DELETE FROM agent_interactions; -- New line
DELETE FROM agent_training_data; -- New line
DELETE FROM agent_deployments; -- New line
DELETE FROM agent_repositories; -- New line
DELETE FROM created_agents; -- Modified line
DELETE FROM connected_agents; -- Modified line
DELETE FROM agent_model_configs;
DELETE FROM agent_templates;

-- Model and ML related cleanup
DELETE FROM model_usage_tracking;
DELETE FROM model_performance_metrics;
DELETE FROM model_evaluations;
DELETE FROM model_fine_tuning_jobs;
DELETE FROM model_lineage;
DELETE FROM model_approvals;
DELETE FROM model_deployments;
DELETE FROM model_connections;
DELETE FROM model_registry;
DELETE FROM ai_model_providers;
DELETE FROM ai_models;

-- Assessment and testing cleanup
DELETE FROM assessment_results;
DELETE FROM test_executions;
DELETE FROM automated_assessments;
DELETE FROM test_suites;
DELETE FROM assessment_schedules;
DELETE FROM assessment_templates;

-- Integration and monitoring cleanup
DELETE FROM integration_alerts;
DELETE FROM integration_events;
DELETE FROM integration_executions;
DELETE FROM integration_health_checks;
DELETE FROM integration_usage_analytics;
DELETE FROM integration_dependencies;
DELETE FROM integration_instances;
DELETE FROM integration_registry;
DELETE FROM integration_settings;
DELETE FROM webhook_endpoints;
DELETE FROM monitoring_alerts;
DELETE FROM monitoring_sessions;
DELETE FROM drift_detections;
DELETE FROM drift_monitors;

-- Analytics and insights cleanup
DELETE FROM analytics_insights;
DELETE FROM anomaly_patterns;
DELETE FROM detected_anomalies;
DELETE FROM anomaly_detection_models;
DELETE FROM forecasting_predictions;
DELETE FROM forecasting_scenarios;
DELETE FROM forecasting_models;
DELETE FROM financial_forecasts;
DELETE FROM predictive_alerts;

-- Business and financial cleanup
DELETE FROM payments;
DELETE FROM subscriptions;
DELETE FROM stripe_webhook_events;
DELETE FROM stripe_customers;
DELETE FROM subscription_plans;
DELETE FROM transactions;
DELETE FROM infrastructure_costs;
DELETE FROM cost_centers;
DELETE FROM cost_optimization_recommendations;
DELETE FROM business_initiatives;
DELETE FROM roi_metrics;
DELETE FROM competitive_analysis;
DELETE FROM competitors;
DELETE FROM market_trends;

-- Governance and compliance cleanup
DELETE FROM governance_alerts;
DELETE FROM governance_monitoring_rules;
DELETE FROM governance_chain_metadata;
DELETE FROM policy_violations;
DELETE FROM policy_agent_assignments;
DELETE FROM compliance_checks;
DELETE FROM risk_assessments;
DELETE FROM security_threats;
DELETE FROM incidents;
DELETE FROM governance_policies;
DELETE FROM policies;
DELETE FROM project_policies;

-- Training and education cleanup
DELETE FROM certificates;
DELETE FROM quiz_attempts;
DELETE FROM training_progress;
DELETE FROM training_sessions;
DELETE FROM training_simulations;
DELETE FROM training_modules;
DELETE FROM training_categories;

-- Feature and data management cleanup
DELETE FROM feature_usage;
DELETE FROM features;
DELETE FROM feature_groups;
DELETE FROM data_transformations;

-- Capacity and performance cleanup
DELETE FROM capacity_recommendations;
DELETE FROM capacity_planning_models;
DELETE FROM resource_utilization_history;
DELETE FROM performance_baselines;
DELETE FROM system_health_metrics;

-- Investigation and root cause cleanup
DELETE FROM investigation_evidence;
DELETE FROM root_cause_investigations;
DELETE FROM cause_effect_relationships;

-- Reporting and dashboard cleanup
DELETE FROM executive_reports;
DELETE FROM reports;
DELETE FROM custom_dashboards;
DELETE FROM dashboard_shares;
DELETE FROM dashboard_widgets;
DELETE FROM widget_templates;
DELETE FROM theme_templates;

-- KPI and measurement cleanup
DELETE FROM kpi_measurements;
DELETE FROM kpi_definitions;
DELETE FROM benchmark_standards;

-- Notification and communication cleanup
DELETE FROM push_notifications;
DELETE FROM notifications;
DELETE FROM notification_settings;

-- API and routing cleanup
DELETE FROM api_routes;

-- A/B testing cleanup
DELETE FROM ab_test_results;
DELETE FROM ab_experiments;

-- Mobile and session cleanup
DELETE FROM mobile_sessions;

-- Audit and logging cleanup
DELETE FROM audit_logs;
DELETE FROM sdk_logs;
DELETE FROM ledger_records;

-- Repository and project cleanup
DELETE FROM repositories;
DELETE FROM projects;

-- Organization and user cleanup (do these last)
DELETE FROM organizations;
-- Simplified user deletion to avoid complex WHERE clause that might fail
DELETE FROM users;

-- Fixed sequence reset to use information_schema instead of pg_attribute
-- Reset any sequences to start from 1 (for tables with serial/auto-increment columns)
-- This ensures clean ID numbering when you start adding data again
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    )
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Vacuum and analyze tables for optimal performance
VACUUM ANALYZE;

SELECT 'Database successfully wiped clean! All data deleted, structures preserved.' as result;
