-- Add test data for lineage display
INSERT INTO connected_agents (id, name, description, status, created_at) VALUES 
('test-agent-1', 'Playground Test Agent', 'Agent created during playground testing', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO lineage_mapping (id, source_type, source_id, target_type, target_id, relationship_type, agent_id, metadata, created_at) VALUES 
('test-lineage-1', 'playground', 'test-1', 'database', 'users', 'query', 'test-agent-1', '{"action": "SELECT", "table": "users"}', NOW()),
('test-lineage-2', 'playground', 'test-2', 'api', 'user-endpoint', 'call', 'test-agent-1', '{"method": "GET", "endpoint": "/api/users"}', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at) VALUES 
('audit-1', 'system', 'playground_test', 'agent', 'test-agent-1', '{"test": "playground execution", "result": "success"}', NOW()),
('audit-2', 'system', 'database_query', 'table', 'users', '{"query": "SELECT * FROM users", "rows": 5}', NOW())
ON CONFLICT (id) DO NOTHING;
