-- Fix agent ID format mismatch between playground and connected_agents table
-- The playground generates string IDs but connected_agents expects UUIDs

-- First, let's see what data exists
DO $$
BEGIN
    RAISE NOTICE 'Checking existing data in connected_agents table...';
END $$;

-- Update connected_agents table to use string IDs instead of UUIDs
ALTER TABLE connected_agents 
ALTER COLUMN id TYPE VARCHAR(255);

-- Also update the agent_id column in lineage_mapping to ensure consistency
ALTER TABLE lineage_mapping 
ALTER COLUMN agent_id TYPE VARCHAR(255);

-- Update any foreign key references if they exist
DO $$
BEGIN
    -- Check if there are any foreign key constraints and update them
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'lineage_mapping' 
        AND constraint_name LIKE '%agent%'
    ) THEN
        -- Drop and recreate foreign key constraint with proper type
        ALTER TABLE lineage_mapping DROP CONSTRAINT IF EXISTS lineage_mapping_agent_id_fkey;
        ALTER TABLE lineage_mapping ADD CONSTRAINT lineage_mapping_agent_id_fkey 
            FOREIGN KEY (agent_id) REFERENCES connected_agents(id);
    END IF;
END $$;

-- Create index for better performance on string-based lookups
CREATE INDEX IF NOT EXISTS idx_connected_agents_id ON connected_agents(id);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_agent_id ON lineage_mapping(agent_id);

-- Insert some test data to ensure the playground agent IDs work
INSERT INTO connected_agents (id, agent_id, name, provider, endpoint, status, created_at, updated_at)
VALUES 
    ('agent_1755550401758_lon42u2bd', 'agent_1755550401758_lon42u2bd', 'Test Playground Agent', 'OpenAI', 'https://api.openai.com/v1/chat/completions', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    endpoint = EXCLUDED.endpoint,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Verify the fix worked
DO $$
DECLARE
    agent_count INTEGER;
    lineage_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agent_count FROM connected_agents WHERE id LIKE 'agent_%';
    SELECT COUNT(*) INTO lineage_count FROM lineage_mapping WHERE agent_id LIKE 'agent_%';
    
    RAISE NOTICE 'Connected agents with string IDs: %', agent_count;
    RAISE NOTICE 'Lineage entries with string agent IDs: %', lineage_count;
END $$;
