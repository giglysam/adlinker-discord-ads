
-- Remove pending status from ads table by updating default status to 'public'
ALTER TABLE ads ALTER COLUMN status SET DEFAULT 'public';

-- Update any existing pending ads to public
UPDATE ads SET status = 'public' WHERE status = 'pending';

-- Add webhook logs table to track all webhook activities
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  response_status INTEGER,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_delivered_at ON webhook_logs(delivered_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- Add RLS policies for webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own webhook logs
CREATE POLICY "Users can view their own webhook logs" ON webhook_logs
FOR SELECT USING (
  webhook_id IN (
    SELECT id FROM webhooks WHERE user_id = auth.uid()
  )
);

-- Policy for service role to insert logs
CREATE POLICY "Service role can insert webhook logs" ON webhook_logs
FOR INSERT WITH CHECK (true);

-- Policy for admins to view all logs
CREATE POLICY "Admins can view all webhook logs" ON webhook_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Update webhooks table to track more statistics
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS total_errors INTEGER DEFAULT 0;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMP WITH TIME ZONE;

-- Create a function to increment user balance
CREATE OR REPLACE FUNCTION increment_user_balance(user_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET balance = COALESCE(balance, 0) + amount,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
