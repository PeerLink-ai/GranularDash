-- Add billing-related columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan_id') THEN
        ALTER TABLE users ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing users to have trial status
UPDATE users 
SET subscription_status = 'trialing', 
    trial_ends_at = NOW() + INTERVAL '14 days'
WHERE subscription_status IS NULL OR subscription_status = 'inactive';
