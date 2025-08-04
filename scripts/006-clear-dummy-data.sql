-- Clear all dummy/sample data from tables
DELETE FROM audit_logs;
DELETE FROM connected_agents;
DELETE FROM user_sessions;
DELETE FROM user_permissions;

-- Keep the users table structure but remove any test users
-- Only remove users that look like test data (you may want to customize this)
DELETE FROM users WHERE email LIKE '%@example.com' OR email LIKE '%test%' OR email LIKE '%demo%';

-- Reset any auto-increment sequences if they exist
-- This ensures clean IDs for new data
