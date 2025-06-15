
-- Update the ads table to ensure expires_at is properly set when admin approves
-- Add a trigger to automatically set expires_at when status changes to 'public'
CREATE OR REPLACE FUNCTION set_ad_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'public' and expires_at is not set, set a default expiration
  IF NEW.status = 'public' AND OLD.status != 'public' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours' * COALESCE(NEW.duration_hours, 24);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic expiration setting
DROP TRIGGER IF EXISTS trigger_set_ad_expiration ON ads;
CREATE TRIGGER trigger_set_ad_expiration
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION set_ad_expiration();

-- Add index for efficient querying of non-expired ads
CREATE INDEX IF NOT EXISTS idx_ads_status_expires_at ON ads(status, expires_at);
