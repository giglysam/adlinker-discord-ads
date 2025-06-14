
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

    // Function to trigger distribution using direct HTTP call with proper auth
    const triggerDistribution = async () => {
      try {
        console.log('⏰ Triggering scheduled ad distribution...')
        
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/distribute-ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({ scheduled: true })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Distribution triggered successfully:', data)
        } else {
          const errorText = await response.text()
          console.error('❌ Error response from distribute-ads:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Error triggering distribution:', error)
      }
    }

    // Initial distribution
    await triggerDistribution()

    // Set up continuous distribution every 3 minutes
    const intervalId = setInterval(triggerDistribution, 3 * 60 * 1000) // 3 minutes

    // Keep the function running for 30 minutes, then let it restart
    await new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(intervalId)
        console.log('🔄 Scheduler cycle complete, will restart automatically')
        resolve(undefined)
      }, 25 * 60 * 1000) // Run for 25 minutes
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Ad scheduling system completed cycle successfully',
        interval: '3 minutes',
        cycleDuration: '25 minutes'
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
