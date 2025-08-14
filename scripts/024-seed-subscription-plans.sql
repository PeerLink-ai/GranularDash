-- Create subscription plans for the billing system
INSERT INTO subscription_plans (
  id,
  name,
  description,
  stripe_price_id,
  stripe_product_id,
  amount,
  currency,
  interval,
  interval_count,
  trial_period_days,
  features,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Starter',
  'Perfect for small teams getting started with AI governance',
  'price_starter_monthly', -- Replace with your actual Stripe price ID
  'prod_starter', -- Replace with your actual Stripe product ID
  2900, -- $29.00 in cents
  'usd',
  'month',
  1,
  14,
  '["Up to 5 AI agents", "Basic compliance monitoring", "Email support", "Standard security features", "Monthly reports"]'::jsonb,
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Professional',
  'Advanced features for growing organizations',
  'price_professional_monthly', -- Replace with your actual Stripe price ID
  'prod_professional', -- Replace with your actual Stripe product ID
  9900, -- $99.00 in cents
  'usd',
  'month',
  1,
  14,
  '["Up to 25 AI agents", "Advanced compliance monitoring", "Priority support", "Enhanced security features", "Real-time alerts", "Custom policies", "API access"]'::jsonb,
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Enterprise',
  'Complete solution for large organizations',
  'price_enterprise_monthly', -- Replace with your actual Stripe price ID
  'prod_enterprise', -- Replace with your actual Stripe product ID
  29900, -- $299.00 in cents
  'usd',
  'month',
  1,
  14,
  '["Unlimited AI agents", "Full compliance suite", "24/7 dedicated support", "Enterprise security", "Custom integrations", "Advanced analytics", "White-label options", "SLA guarantees"]'::jsonb,
  true,
  NOW(),
  NOW()
);
