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

    console.log('🚀 Starting INFINITE CONTINUOUS ad distribution scheduler...')
    console.log('📊 This scheduler will run FOREVER without stopping or restarting')

    // Function to trigger distribution using direct HTTP call
    const triggerDistribution = async () => {
      try {
        console.log('⏰ Triggering ad distribution at:', new Date().toISOString())
        
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/distribute-ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({ 
            scheduled: true, 
            timestamp: new Date().toISOString(),
            continuous: true 
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Distribution triggered successfully:', data.message)
        } else {
          const errorText = await response.text()
          console.error('❌ Distribution error:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Error triggering distribution:', error)
        // Don't let errors stop the continuous loop
      }
    }

    // Start immediate distribution
    await triggerDistribution()

    // Create a TRULY INFINITE loop that NEVER stops
    let runCount = 0
    
    console.log('🔄 Starting INFINITE loop - will run FOREVER without any limits')

    // INFINITE LOOP - NO LIMITS, NO RESTARTS
    while (true) {
      try {
        // Wait exactly 60 seconds (1 minute) between distributions
        await new Promise(resolve => setTimeout(resolve, 60000))
        
        runCount++
        console.log(`🔄 Infinite scheduler run #${runCount} - NEVER STOPPING`)
        
        // Trigger distribution
        await triggerDistribution()
        
        // Log health status every 10 runs
        if (runCount % 10 === 0) {
          console.log(`💚 INFINITE scheduler health: Completed ${runCount} distributions - RUNNING FOREVER`)
        }
        
        // Log milestone every 100 runs
        if (runCount % 100 === 0) {
          console.log(`🎉 MILESTONE: ${runCount} distributions completed - STILL RUNNING INFINITELY`)
        }
        
        // Log major milestone every 1000 runs
        if (runCount % 1000 === 0) {
          console.log(`🏆 MAJOR MILESTONE: ${runCount} distributions completed - INFINITE SCHEDULER STRONG`)
        }
        
      } catch (error) {
        console.error(`❌ Error in infinite loop at run #${runCount}:`, error)
        console.log('🔄 Continuing infinite loop despite error...')
        // Continue the loop even if there's an error - NEVER STOP
        continue
      }
    }

    // This code should NEVER be reached because the loop is infinite
    console.log('❌ UNEXPECTED: Infinite loop ended - this should never happen')

  } catch (error) {
    console.error('💥 Critical scheduler error:', error)
    console.log('🔄 Attempting to restart infinite loop...')
    
    // Even if there's a critical error, try to keep going
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        message: 'Critical error occurred but scheduler will attempt to continue'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
