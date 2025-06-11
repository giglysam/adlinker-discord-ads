
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

    console.log('Starting automated ad scheduler...')

    // Check if there are any active webhooks and public ads
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    const { data: ads } = await supabase
      .from('ads')
      .select('id')
      .eq('status', 'public')
      .limit(1)

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found, skipping distribution')
      return new Response(
        JSON.stringify({ message: 'No active webhooks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ads || ads.length === 0) {
      console.log('No public ads found, skipping distribution')
      return new Response(
        JSON.stringify({ message: 'No public ads found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the distribute-ads function
    const { data, error } = await supabase.functions.invoke('distribute-ads')

    if (error) {
      console.error('Error calling distribute-ads:', error)
      throw error
    }

    console.log('Ad distribution triggered successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Ad distribution triggered successfully',
        result: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Scheduler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
