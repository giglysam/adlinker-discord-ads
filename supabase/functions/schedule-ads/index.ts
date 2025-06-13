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

    console.log('🔄 Starting automatic ad scheduling system...')

    // Function to trigger distribution
    const triggerDistribution = async () => {
      try {
        console.log('⏰ Triggering scheduled ad distribution...')
        await supabase.functions.invoke('distribute-ads')
        console.log('✅ Distribution triggered successfully')
      } catch (error) {
        console.error('❌ Error triggering distribution:', error)
      }
    }

    // Initial distribution
    await triggerDistribution()

    // Set up continuous distribution every 30 minutes
    const intervalId = setInterval(triggerDistribution, 30 * 60 * 1000) // 30 minutes

    // Keep the function running
    await new Promise((resolve) => {
      // This will keep the function alive
      setTimeout(() => {
        clearInterval(intervalId)
        resolve(undefined)
      }, 24 * 60 * 60 * 1000) // Run for 24 hours, then restart
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Ad scheduling system started successfully',
        interval: '30 minutes',
        duration: '24 hours'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Scheduler error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
