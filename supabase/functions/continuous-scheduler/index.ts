
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

    console.log('🔄 Starting CONTINUOUS ad distribution scheduler...')

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
          body: JSON.stringify({ scheduled: true, timestamp: new Date().toISOString() })
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
      }
    }

    // Start immediate distribution
    await triggerDistribution()

    // Create a continuous loop that never stops
    let runCount = 0
    const maxRunsBeforeRestart = 1000 // Restart after 1000 runs to prevent memory issues

    while (runCount < maxRunsBeforeRestart) {
      try {
        // Wait exactly 60 seconds (1 minute) between distributions
        await new Promise(resolve => setTimeout(resolve, 60000))
        
        runCount++
        console.log(`🔄 Continuous scheduler run #${runCount}`)
        
        // Trigger distribution
        await triggerDistribution()
        
        // Log health status every 10 runs
        if (runCount % 10 === 0) {
          console.log(`💚 Scheduler health check: Completed ${runCount} distributions successfully`)
        }
        
      } catch (error) {
        console.error(`❌ Error in continuous loop at run #${runCount}:`, error)
        // Continue the loop even if there's an error
        continue
      }
    }

    console.log(`🔄 Scheduler reached max runs (${maxRunsBeforeRestart}), will restart automatically`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Continuous scheduler completed ${runCount} runs and will restart`,
        totalRuns: runCount,
        status: 'restarting'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Continuous scheduler error:', error)
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
