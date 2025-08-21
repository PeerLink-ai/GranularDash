-- Add organization column to sdk_logs table for proper data isolation
ALTER TABLE sdk_logs ADD COLUMN IF NOT EXISTS organization VARCHAR(255) DEFAULT 'default';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sdk_logs_organization ON sdk_logs(organization);

-- Update existing records to have default organization
UPDATE sdk_logs SET organization = 'default' WHERE organization IS NULL;
