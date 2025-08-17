-- Seed comprehensive analytics data

-- Insert sample transactions for revenue analytics
INSERT INTO transactions (organization_id, user_id, amount, product_name, transaction_type, status, created_at) VALUES
-- Current month
(1, 1, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '5 days'),
(1, 2, 99.99, 'Basic Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '10 days'),
(1, 3, 499.99, 'Enterprise Plan', 'subscription', 'completed', NOW() - INTERVAL '15 days'),
(1, 4, 199.99, 'Premium Features', 'one_time', 'completed', NOW() - INTERVAL '20 days'),
(1, 5, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '25 days'),

-- Previous months for trend analysis
(1, 1, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '35 days'),
(1, 2, 99.99, 'Basic Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '40 days'),
(1, 3, 499.99, 'Enterprise Plan', 'subscription', 'completed', NOW() - INTERVAL '45 days'),
(1, 4, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '65 days'),
(1, 5, 199.99, 'Premium Features', 'one_time', 'completed', NOW() - INTERVAL '70 days'),

-- Older data for 12-month trend
(1, 1, 199.99, 'Basic Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '95 days'),
(1, 2, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '125 days'),
(1, 3, 99.99, 'Basic Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '155 days'),
(1, 4, 499.99, 'Enterprise Plan', 'subscription', 'completed', NOW() - INTERVAL '185 days'),
(1, 5, 299.99, 'Pro Plan Subscription', 'subscription', 'completed', NOW() - INTERVAL '215 days');

-- Insert sample notifications for security metrics
INSERT INTO notifications (organization_id, user_id, notification_type, message, severity, read, created_at) VALUES
(1, 1, 'security_alert', 'Unusual API access pattern detected from Agent-007', 'high', false, NOW() - INTERVAL '2 hours'),
(1, 2, 'security_alert', 'Failed authentication attempts exceeded threshold', 'medium', false, NOW() - INTERVAL '1 day'),
(1, NULL, 'policy_violation', 'Agent exceeded rate limit policy', 'medium', true, NOW() - INTERVAL '3 days'),
(1, 3, 'security_alert', 'Suspicious data access pattern detected', 'high', false, NOW() - INTERVAL '5 days'),
(1, NULL, 'system_alert', 'System maintenance completed successfully', 'info', true, NOW() - INTERVAL '7 days');

-- Insert sample audit logs for compliance tracking
INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, details, created_at) VALUES
(1, 1, 'policy_violation_detected', 'agent', 'agent-007', '{"violation_type": "rate_limit", "threshold": 1000, "actual": 1250}', NOW() - INTERVAL '2 days'),
(1, 2, 'security_scan_completed', 'system', 'security-scanner', '{"threats_found": 0, "vulnerabilities": 1}', NOW() - INTERVAL '1 day'),
(1, 3, 'compliance_check_passed', 'policy', 'data-retention', '{"status": "compliant", "score": 95}', NOW() - INTERVAL '3 days'),
(1, 1, 'agent_access_granted', 'agent', 'agent-123', '{"permissions": ["read", "write"], "scope": "limited"}', NOW() - INTERVAL '5 days'),
(1, 2, 'policy_violation_resolved', 'agent', 'agent-007', '{"resolution": "rate_limit_increased", "new_limit": 1500}', NOW() - INTERVAL '1 day');

-- Insert notification settings for users
INSERT INTO notification_settings (user_id, notification_type, enabled) VALUES
(1, 'security_alerts', true),
(1, 'policy_violations', true),
(1, 'agent_anomalies', true),
(1, 'system_updates', false),
(1, 'compliance_reports', true),
(2, 'security_alerts', true),
(2, 'policy_violations', false),
(2, 'agent_anomalies', true),
(2, 'system_updates', true),
(2, 'compliance_reports', true);

-- Insert sample reports
INSERT INTO reports (organization_id, user_id, report_type, status, data, created_at) VALUES
(1, 1, 'SOC2', 'completed', '{"compliance_score": 95, "findings": 2, "recommendations": 5}', NOW() - INTERVAL '7 days'),
(1, 2, 'GDPR', 'completed', '{"data_subjects": 1250, "requests_processed": 15, "breaches": 0}', NOW() - INTERVAL '14 days'),
(1, 1, 'Security Audit', 'completed', '{"vulnerabilities": 3, "critical": 0, "high": 1, "medium": 2}', NOW() - INTERVAL '21 days'),
(1, 3, 'Agent Security', 'pending', '{"agents_scanned": 8, "issues_found": 1}', NOW() - INTERVAL '2 days'),
(1, 2, 'Policy Violations', 'completed', '{"total_violations": 12, "resolved": 10, "pending": 2}', NOW() - INTERVAL '30 days');
