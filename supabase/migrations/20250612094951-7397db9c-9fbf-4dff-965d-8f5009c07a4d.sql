
-- Drop existing webhook-related tables to start fresh
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS ad_deliveries CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;

-- Create a clean webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  server_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_sent INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT
);

-- Create webhook_logs table for monitoring
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'success' or 'error'
  error_message TEXT,
  response_status INTEGER,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ad_deliveries table for tracking earnings
CREATE TABLE public.ad_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'success' or 'error'
  earning_amount NUMERIC DEFAULT 0.00001,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add duration_hours column to ads table for admin-controlled ad duration
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 24;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all tables
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhooks (users can only see their own)
CREATE POLICY "Users can view their own webhooks" ON public.webhooks
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert their own webhooks" ON public.webhooks
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can update their own webhooks" ON public.webhooks
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can delete their own webhooks" ON public.webhooks
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- RLS policies for webhook_logs (users can only see logs for their webhooks)
CREATE POLICY "Users can view logs for their webhooks" ON public.webhook_logs
  FOR SELECT USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')));

-- RLS policies for ad_deliveries (users can only see deliveries for their webhooks)
CREATE POLICY "Users can view deliveries for their webhooks" ON public.ad_deliveries
  FOR SELECT USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')));

-- Admin policies (full access for admins)
CREATE POLICY "Admins can do everything on webhooks" ON public.webhooks
  FOR ALL USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

CREATE POLICY "Admins can do everything on webhook_logs" ON public.webhook_logs
  FOR ALL USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

CREATE POLICY "Admins can do everything on ad_deliveries" ON public.ad_deliveries
  FOR ALL USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

-- Service role policies for edge functions
CREATE POLICY "Service role can manage webhooks" ON public.webhooks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage webhook_logs" ON public.webhook_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage ad_deliveries" ON public.ad_deliveries
  FOR ALL USING (auth.role() = 'service_role');
