-- Make the agent_id foreign key constraint optional to handle playground scenarios
-- where agents might not exist in connected_agents table yet

-- First, drop the existing foreign key constraint
ALTER TABLE lineage_mapping 
DROP CONSTRAINT IF EXISTS lineage_mapping_agent_id_fkey;

-- Add it back as a nullable foreign key that allows orphaned records
ALTER TABLE lineage_mapping 
ADD CONSTRAINT lineage_mapping_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) 
ON DELETE SET NULL;

-- Also ensure the agent_id column can be null
ALTER TABLE lineage_mapping 
ALTER COLUMN agent_id DROP NOT NULL;

-- Create an index for better performance on agent_id lookups
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_agent_id ON lineage_mapping(agent_id);
