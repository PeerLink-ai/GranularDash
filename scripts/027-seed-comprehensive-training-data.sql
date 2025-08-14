-- Clear existing training data to start fresh
DELETE FROM training_sessions;
DELETE FROM training_progress;
DELETE FROM training_simulations WHERE organization_id = 'Hive';
DELETE FROM training_modules WHERE organization_id = 'Hive';
DELETE FROM training_categories WHERE organization_id = 'Hive';

-- Insert training categories
INSERT INTO training_categories (organization_id, name, description, color) VALUES
('Hive', 'Security Awareness', 'Cybersecurity training and threat awareness programs', '#ef4444'),
('Hive', 'Compliance & Governance', 'Regulatory compliance and policy training', '#3b82f6'),
('Hive', 'AI Ethics & Safety', 'Responsible AI development and deployment practices', '#8b5cf6'),
('Hive', 'Data Protection', 'Privacy, data handling, and GDPR compliance', '#10b981'),
('Hive', 'Incident Response', 'Emergency procedures and crisis management', '#f59e0b'),
('Hive', 'Technical Skills', 'Platform-specific and technical competency training', '#06b6d4');

-- Insert comprehensive training modules
INSERT INTO training_modules (organization_id, name, type, description, content, status) VALUES
('Hive', 'Advanced Phishing Detection', 'Security Awareness', 'Comprehensive training on identifying sophisticated phishing attacks, including spear phishing, whaling, and business email compromise', '{"duration": 45, "difficulty": "intermediate", "modules": ["Email Analysis", "URL Inspection", "Social Engineering Tactics"]}', 'active'),
('Hive', 'GDPR Compliance Fundamentals', 'Compliance & Governance', 'Essential training on General Data Protection Regulation requirements, data subject rights, and breach notification procedures', '{"duration": 60, "difficulty": "beginner", "modules": ["Data Processing Principles", "Consent Management", "Breach Response"]}', 'active'),
('Hive', 'AI Model Bias Detection', 'AI Ethics & Safety', 'Training on identifying, measuring, and mitigating bias in machine learning models across different demographic groups', '{"duration": 90, "difficulty": "advanced", "modules": ["Bias Types", "Fairness Metrics", "Mitigation Strategies"]}', 'active'),
('Hive', 'Secure Code Review', 'Technical Skills', 'Best practices for reviewing code for security vulnerabilities, including OWASP Top 10 and secure coding standards', '{"duration": 120, "difficulty": "advanced", "modules": ["Static Analysis", "Dynamic Testing", "Threat Modeling"]}', 'active'),
('Hive', 'Data Classification & Handling', 'Data Protection', 'Training on proper classification, storage, and transmission of sensitive data according to organizational policies', '{"duration": 30, "difficulty": "beginner", "modules": ["Classification Levels", "Storage Requirements", "Transmission Protocols"]}', 'active'),
('Hive', 'Incident Response Procedures', 'Incident Response', 'Comprehensive guide to incident detection, containment, eradication, and recovery procedures', '{"duration": 75, "difficulty": "intermediate", "modules": ["Detection Methods", "Containment Strategies", "Recovery Planning"]}', 'active'),
('Hive', 'Social Engineering Defense', 'Security Awareness', 'Training on recognizing and defending against social engineering attacks including pretexting, baiting, and tailgating', '{"duration": 40, "difficulty": "intermediate", "modules": ["Attack Vectors", "Psychological Tactics", "Defense Strategies"]}', 'active'),
('Hive', 'AI Explainability Standards', 'AI Ethics & Safety', 'Understanding and implementing explainable AI practices for regulatory compliance and ethical deployment', '{"duration": 85, "difficulty": "advanced", "modules": ["XAI Techniques", "Regulatory Requirements", "Implementation Guidelines"]}', 'active'),
('Hive', 'Zero Trust Architecture', 'Technical Skills', 'Implementation and management of zero trust security models in cloud and hybrid environments', '{"duration": 100, "difficulty": "advanced", "modules": ["Architecture Principles", "Identity Verification", "Network Segmentation"]}', 'active'),
('Hive', 'Privacy Impact Assessments', 'Compliance & Governance', 'Conducting thorough privacy impact assessments for new projects and system implementations', '{"duration": 55, "difficulty": "intermediate", "modules": ["Assessment Framework", "Risk Evaluation", "Mitigation Planning"]}', 'active'),
('Hive', 'Ransomware Response Protocol', 'Incident Response', 'Specialized training for ransomware incident response, including negotiation strategies and recovery procedures', '{"duration": 65, "difficulty": "advanced", "modules": ["Attack Identification", "Containment Procedures", "Recovery Strategies"]}', 'active'),
('Hive', 'API Security Best Practices', 'Technical Skills', 'Securing REST and GraphQL APIs, including authentication, authorization, and rate limiting', '{"duration": 80, "difficulty": "intermediate", "modules": ["Authentication Methods", "Input Validation", "Rate Limiting"]}', 'active');

-- Insert realistic training simulations with recent dates
INSERT INTO training_simulations (organization_id, name, type, description, status, last_run, completed_at, score, duration_minutes, participants_count, pass_threshold, difficulty_level, configuration, results) VALUES
('Hive', 'Q4 Phishing Campaign Simulation', 'Security Awareness', 'Quarterly phishing simulation targeting all employees with realistic attack scenarios', 'completed', '2024-12-15 09:00:00', '2024-12-15 17:30:00', 87, 30, 156, 80, 'intermediate', '{"email_templates": 12, "target_groups": ["all_employees"], "difficulty": "medium"}', '{"click_rate": 13, "report_rate": 78, "training_completed": 142}'),

('Hive', 'Advanced Persistent Threat Drill', 'Incident Response', 'Tabletop exercise simulating a sophisticated APT attack on critical infrastructure', 'completed', '2024-12-10 14:00:00', '2024-12-10 18:00:00', 92, 240, 24, 85, 'advanced', '{"scenario": "apt_attack", "systems": ["production", "staging"], "duration_hours": 4}', '{"response_time": 18, "containment_success": true, "lessons_learned": 8}'),

('Hive', 'AI Bias Detection Workshop', 'AI Ethics & Safety', 'Interactive workshop on identifying and mitigating bias in production ML models', 'completed', '2024-12-08 10:00:00', '2024-12-08 16:00:00', 89, 360, 18, 80, 'advanced', '{"models_tested": 5, "bias_metrics": ["demographic_parity", "equalized_odds"], "datasets": 3}', '{"bias_detected": 3, "mitigation_strategies": 5, "model_improvements": 2}'),

('Hive', 'Data Breach Response Simulation', 'Incident Response', 'Full-scale simulation of a data breach affecting customer PII with regulatory notification requirements', 'completed', '2024-12-05 08:00:00', '2024-12-05 20:00:00', 85, 720, 32, 85, 'advanced', '{"breach_type": "database_compromise", "records_affected": 50000, "jurisdictions": ["EU", "US"]}', '{"notification_time": 68, "regulatory_compliance": true, "customer_impact": "minimal"}'),

('Hive', 'Social Engineering Awareness Test', 'Security Awareness', 'Multi-vector social engineering test including phone calls, physical access attempts, and email', 'completed', '2024-12-01 09:00:00', '2024-12-01 17:00:00', 76, 45, 89, 75, 'intermediate', '{"vectors": ["phone", "email", "physical"], "scenarios": 8, "difficulty": "medium"}', '{"success_rate": 24, "awareness_improvement": 67, "policy_violations": 3}'),

('Hive', 'Ransomware Response Exercise', 'Incident Response', 'Comprehensive ransomware incident response including backup recovery and business continuity', 'in_progress', '2024-12-18 10:00:00', NULL, NULL, 180, 28, 85, 'advanced', '{"ransomware_family": "lockbit", "systems_affected": ["file_servers", "databases"], "backup_scenario": "partial_corruption"}', NULL),

('Hive', 'GDPR Compliance Audit Simulation', 'Compliance & Governance', 'Mock regulatory audit focusing on GDPR compliance across all business units', 'scheduled', NULL, NULL, NULL, 480, 45, 80, 'intermediate', '{"audit_scope": "full_organization", "focus_areas": ["consent", "data_processing", "breach_procedures"], "auditor_type": "external"}', NULL),

('Hive', 'Zero Trust Implementation Challenge', 'Technical Skills', 'Hands-on simulation of implementing zero trust architecture in a hybrid cloud environment', 'scheduled', NULL, NULL, NULL, 300, 15, 85, 'advanced', '{"environment": "hybrid_cloud", "components": ["identity", "network", "endpoints"], "tools": ["azure_ad", "aws_iam"]}', NULL),

('Hive', 'AI Model Poisoning Detection', 'AI Ethics & Safety', 'Advanced simulation testing ability to detect and respond to adversarial attacks on ML models', 'scheduled', NULL, NULL, NULL, 240, 12, 90, 'advanced', '{"attack_types": ["data_poisoning", "model_inversion"], "models": ["classification", "regression"], "detection_methods": 4}', NULL),

('Hive', 'Insider Threat Investigation', 'Security Awareness', 'Simulation of investigating and responding to potential insider threat scenarios', 'scheduled', NULL, NULL, NULL, 360, 20, 80, 'advanced', '{"threat_type": "malicious_insider", "investigation_tools": ["dlp", "ueba", "forensics"], "legal_considerations": true}', NULL);

-- Insert training sessions for completed simulations
INSERT INTO training_sessions (simulation_id, user_id, organization_id, started_at, completed_at, score, status, time_spent_minutes, answers, feedback) VALUES
-- Phishing Campaign Simulation sessions
(1, 1, 'Hive', '2024-12-15 09:15:00', '2024-12-15 09:45:00', 95, 'completed', 28, '{"emails_identified": 11, "false_positives": 1, "reporting_time": "2_minutes"}', 'Excellent performance identifying phishing attempts'),
(1, 2, 'Hive', '2024-12-15 10:30:00', '2024-12-15 11:00:00', 82, 'completed', 32, '{"emails_identified": 9, "false_positives": 2, "reporting_time": "4_minutes"}', 'Good awareness, needs improvement on subtle indicators'),
(1, 3, 'Hive', '2024-12-15 14:20:00', '2024-12-15 14:50:00', 78, 'completed', 35, '{"emails_identified": 8, "false_positives": 3, "reporting_time": "6_minutes"}', 'Satisfactory performance, recommend additional training'),

-- APT Drill sessions
(2, 1, 'Hive', '2024-12-10 14:00:00', '2024-12-10 18:00:00', 88, 'completed', 240, '{"threats_detected": 4, "response_actions": 12, "escalation_time": "15_minutes"}', 'Strong incident response leadership'),
(2, 4, 'Hive', '2024-12-10 14:00:00', '2024-12-10 18:00:00', 94, 'completed', 240, '{"threats_detected": 5, "response_actions": 15, "escalation_time": "8_minutes"}', 'Exceptional technical analysis and containment'),

-- AI Bias Workshop sessions
(3, 5, 'Hive', '2024-12-08 10:00:00', '2024-12-08 16:00:00', 91, 'completed', 360, '{"bias_cases_identified": 4, "mitigation_strategies": 6, "model_improvements": 3}', 'Excellent understanding of fairness metrics'),
(3, 6, 'Hive', '2024-12-08 10:00:00', '2024-12-08 16:00:00', 86, 'completed', 360, '{"bias_cases_identified": 3, "mitigation_strategies": 5, "model_improvements": 2}', 'Good grasp of concepts, needs practice with implementation');

-- Insert training progress for modules
INSERT INTO training_progress (user_id, module_id, organization_id, progress_percentage, completed, last_accessed, completion_date) VALUES
(1, 1, 'Hive', 100, true, '2024-12-14 16:30:00', '2024-12-14 16:30:00'),
(1, 2, 'Hive', 100, true, '2024-12-12 14:20:00', '2024-12-12 14:20:00'),
(1, 3, 'Hive', 75, false, '2024-12-16 10:15:00', NULL),
(2, 1, 'Hive', 100, true, '2024-12-13 11:45:00', '2024-12-13 11:45:00'),
(2, 4, 'Hive', 100, true, '2024-12-11 15:30:00', '2024-12-11 15:30:00'),
(2, 5, 'Hive', 60, false, '2024-12-15 09:20:00', NULL),
(3, 1, 'Hive', 100, true, '2024-12-10 13:15:00', '2024-12-10 13:15:00'),
(3, 6, 'Hive', 100, true, '2024-12-09 16:45:00', '2024-12-09 16:45:00'),
(4, 2, 'Hive', 100, true, '2024-12-08 12:30:00', '2024-12-08 12:30:00'),
(4, 7, 'Hive', 85, false, '2024-12-16 14:10:00', NULL),
(5, 3, 'Hive', 100, true, '2024-12-07 17:20:00', '2024-12-07 17:20:00'),
(5, 8, 'Hive', 100, true, '2024-12-06 11:30:00', '2024-12-06 11:30:00'),
(6, 9, 'Hive', 100, true, '2024-12-05 15:45:00', '2024-12-05 15:45:00'),
(6, 10, 'Hive', 90, false, '2024-12-16 13:25:00', NULL);
