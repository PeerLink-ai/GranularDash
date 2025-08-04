-- Add invitation fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;

-- Update existing users to have onboarding completed
UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NULL;

-- Create index for invitation token lookups
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_organization_onboarding ON users(organization, onboarding_completed);
