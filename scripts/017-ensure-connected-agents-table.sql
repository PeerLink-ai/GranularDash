-- Ensure connected_agents table exists with proper structure
CREATE TABLE IF NOT EXISTS connected_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    endpoint TEXT NOT NULL,
    api_key TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_connected_agents_user_id ON connected_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_agents_status ON connected_agents(status);
