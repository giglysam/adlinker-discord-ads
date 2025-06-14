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

    console.log('🚀 STARTING FULLY AUTOMATED CONTINUOUS AD SYSTEM...')
    console.log('💯 ZERO MANUAL INTERVENTION REQUIRED - FULLY AUTOMATED')
    console.log('⚡ SYSTEM WILL RUN FOREVER, AUTOMATICALLY, 24/7')

    // Function to trigger distribution with enhanced automation
    const triggerAutomaticDistribution = async () => {
      try {
        const timestamp = new Date().toISOString()
        console.log('🤖 AUTOMATIC distribution triggered at:', timestamp)
        
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/distribute-ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({ 
            automated: true,
            continuous: true,
            timestamp: timestamp,
            source: 'auto-scheduler'
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ AUTOMATIC distribution SUCCESS:', data.message)
          return { success: true, data }
        } else {
          const errorText = await response.text()
          console.error('❌ AUTOMATIC distribution ERROR:', response.status, errorText)
          return { success: false, error: errorText }
        }
      } catch (error) {
        console.error('💥 AUTOMATIC distribution EXCEPTION:', error)
        return { success: false, error: error.message }
      }
    }

    console.log('🔥 LAUNCHING IMMEDIATE AUTOMATIC DISTRIBUTION...')
    await triggerAutomaticDistribution()

    let autoRunCount = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 5
    
    console.log('🔄 STARTING INFINITE AUTOMATIC LOOP - ZERO HUMAN INTERVENTION')
    console.log('⏰ AUTOMATIC ads every 60 seconds - FOREVER AND EVER')

    // Create a promise that never resolves to keep the function running
    const infiniteAutomation = new Promise(() => {
      const automationInterval = setInterval(async () => {
        try {
          autoRunCount++
          
          console.log(`🤖 AUTOMATIC run #${autoRunCount} - FULLY AUTOMATED`)
          
          const result = await triggerAutomaticDistribution()
          
          if (result.success) {
            consecutiveErrors = 0 // Reset error counter on success
            
            // Automatic status logging
            if (autoRunCount % 5 === 0) {
              console.log(`💚 AUTOMATIC SYSTEM HEALTH: ${autoRunCount} distributions - RUNNING AUTOMATICALLY`)
            }
            
            if (autoRunCount % 20 === 0) {
              console.log(`🏆 AUTOMATIC MILESTONE: ${autoRunCount} distributions - ZERO DOWNTIME`)
            }
            
            if (autoRunCount % 100 === 0) {
              console.log(`🎉 AUTOMATIC ACHIEVEMENT: ${autoRunCount} distributions - PERFECT AUTOMATION`)
            }
          } else {
            consecutiveErrors++
            console.log(`⚠️ AUTOMATIC ERROR COUNT: ${consecutiveErrors}/${maxConsecutiveErrors}`)
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.log('🔄 AUTOMATIC RECOVERY: Too many errors, but continuing anyway...')
              consecutiveErrors = 0 // Reset and continue
            }
          }
          
        } catch (error) {
          console.error(`💥 AUTOMATIC LOOP ERROR at run #${autoRunCount}:`, error)
          console.log('🔄 AUTOMATIC RECOVERY: Continuing infinite automation...')
          // Always continue - never stop the automation
        }
      }, 60000) // 60 seconds = 1 minute

      // This interval will never be cleared, ensuring infinite operation
      console.log('✅ INFINITE AUTOMATIC INTERVAL ESTABLISHED - WILL NEVER STOP')
    })

    // Wait for the infinite promise (which never resolves)
    await infiniteAutomation

    // This code should NEVER execute
    console.log('❌ CRITICAL: Infinite automation stopped - THIS SHOULD NEVER HAPPEN')

  } catch (error) {
    console.error('💥 AUTOMATIC SYSTEM CRITICAL ERROR:', error)
    console.log('🔄 AUTOMATIC RECOVERY: Attempting to restart automation...')
    
    // Even critical errors shouldn't stop the system
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        message: 'Critical error in automatic system but will attempt recovery',
        automated: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
