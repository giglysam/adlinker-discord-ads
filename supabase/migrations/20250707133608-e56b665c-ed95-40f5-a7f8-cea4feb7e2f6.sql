
-- Create a table to track ad clicks and IP addresses
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  user_ip INET NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  earning_amount NUMERIC DEFAULT 0.01,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate clicks from same IP for same ad
CREATE UNIQUE INDEX idx_ad_clicks_unique_ip_ad ON ad_clicks(ad_id, user_ip);

-- Add indexes for efficient querying
CREATE INDEX idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX idx_ad_clicks_webhook_id ON ad_clicks(webhook_id);
CREATE INDEX idx_ad_clicks_user_ip ON ad_clicks(user_ip);
CREATE INDEX idx_ad_clicks_clicked_at ON ad_clicks(clicked_at);

-- Enable RLS on ad_clicks table
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_clicks
CREATE POLICY "Users can view clicks for their webhooks" ON public.ad_clicks
  FOR SELECT USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')));

CREATE POLICY "Admins can do everything on ad_clicks" ON public.ad_clicks
  FOR ALL USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

CREATE POLICY "Service role can manage ad_clicks" ON public.ad_clicks
  FOR ALL USING (auth.role() = 'service_role');

-- Create ad redirect function to handle click tracking and redirects
CREATE OR REPLACE FUNCTION handle_ad_click(
  p_ad_id UUID,
  p_webhook_id UUID,
  p_user_ip INET
) RETURNS JSON AS $$
DECLARE
  v_ad_record RECORD;
  v_webhook_record RECORD;
  v_user_id UUID;
  v_earning_amount NUMERIC := 0.01;
  v_click_exists BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- Check if this IP has already clicked this ad
  SELECT EXISTS(
    SELECT 1 FROM ad_clicks 
    WHERE ad_id = p_ad_id AND user_ip = p_user_ip
  ) INTO v_click_exists;
  
  -- Get ad details
  SELECT * FROM ads WHERE id = p_ad_id AND status = 'public' INTO v_ad_record;
  
  -- Get webhook details
  SELECT * FROM webhooks WHERE id = p_webhook_id AND is_active = true INTO v_webhook_record;
  
  IF v_ad_record IS NULL OR v_webhook_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ad or webhook not found',
      'earning', 0
    );
  END IF;
  
  -- If IP hasn't clicked this ad before, record the click and give earning
  IF NOT v_click_exists THEN
    -- Insert click record
    INSERT INTO ad_clicks (ad_id, webhook_id, user_ip, earning_amount)
    VALUES (p_ad_id, p_webhook_id, p_user_ip, v_earning_amount);
    
    -- Update user balance
    UPDATE users 
    SET balance = COALESCE(balance, 0) + v_earning_amount,
        updated_at = NOW()
    WHERE id = v_webhook_record.user_id;
    
    -- Update ad impressions
    UPDATE ads 
    SET impressions = COALESCE(impressions, 0) + 1
    WHERE id = p_ad_id;
    
    v_result := json_build_object(
      'success', true,
      'first_click', true,
      'earning', v_earning_amount,
      'redirect_url', v_ad_record.url
    );
  ELSE
    -- IP has already clicked this ad, no earning
    v_result := json_build_object(
      'success', true,
      'first_click', false,
      'earning', 0,
      'redirect_url', v_ad_record.url
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
