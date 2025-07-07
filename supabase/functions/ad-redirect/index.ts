
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the user's IP address
    const userIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1'

    console.log(`Processing click: ad_id=${adId}, webhook_id=${webhookId}, ip=${userIP}`)

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
