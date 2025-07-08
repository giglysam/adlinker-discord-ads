
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract the first valid IP address from a comma-separated string
function extractFirstValidIP(ipString: string): string {
  if (!ipString) return '127.0.0.1';
  
  // Split by comma and take the first IP, trim whitespace
  const firstIP = ipString.split(',')[0].trim();
  
  // Basic validation - check if it looks like an IP address
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  if (ipRegex.test(firstIP)) {
    return firstIP;
  }
  
  // If not a valid IPv4, return localhost as fallback
  return '127.0.0.1';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const adId = url.searchParams.get('ad_id')
    const webhookId = url.searchParams.get('webhook_id')
    
    if (!adId || !webhookId) {
      return new Response('Missing ad_id or webhook_id parameters', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Get the user's IP address and handle multiple IPs correctly
    const rawIP = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  '127.0.0.1'
    
    const userIP = extractFirstValidIP(rawIP);

    console.log(`Processing click: ad_id=${adId}, webhook_id=${webhookId}, raw_ip=${rawIP}, processed_ip=${userIP}`)

    // Call the database function to handle click tracking
    const { data: result, error } = await supabase.rpc('handle_ad_click', {
      p_ad_id: adId,
      p_webhook_id: webhookId,
      p_user_ip: userIP
    })

    if (error) {
      console.error('Database error:', error)
      return new Response('Database error occurred', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Click processing result:', result)

    if (!result.success) {
      return new Response(result.error || 'Click processing failed', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Redirect the user to the actual ad URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': result.redirect_url
      }
    })

  } catch (error) {
    console.error('Ad redirect error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
