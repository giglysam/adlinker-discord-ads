
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

    const requestBody = await req.json().catch(() => ({}))
    const isAutomated = requestBody.automated || requestBody.continuous || requestBody.scheduled

    console.log('🚀 AUTOMATIC ad distribution starting...', { 
      automated: isAutomated, 
      timestamp: new Date().toISOString() 
    })

    // Get all public ads with enhanced logging
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('❌ AUTOMATIC: Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`📊 AUTOMATIC: Found ${ads?.length || 0} public ads for distribution`)

    // Get ALL ACTIVE webhooks with enhanced logging
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('❌ AUTOMATIC: Error fetching webhooks:', webhooksError)
      throw webhooksError
    }

    console.log(`📊 AUTOMATIC: Found ${webhooks?.length || 0} active webhooks for distribution`)

    if (!ads || ads.length === 0) {
      console.log('⚠️ AUTOMATIC: No public ads to distribute')
      return new Response(
        JSON.stringify({ 
          message: 'No public ads available for automatic distribution',
          automated: isAutomated,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ AUTOMATIC: No active webhooks found')
      return new Response(
        JSON.stringify({ 
          message: 'No active webhooks for automatic distribution',
          automated: isAutomated,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSent = 0
    let totalErrors = 0
    let totalEarnings = 0
    const earnedAmount = 0.00001

    console.log(`🎯 AUTOMATIC: Starting distribution to ${webhooks.length} webhooks...`)

    // Enhanced automatic distribution process
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i]
      const ad = ads[i % ads.length] // Cycle through ads

      try {
        // Create enhanced Discord message for automatic system
        const discordMessage = {
          content: "💰 **AUTOMATIC Sponsored Content** - Earning money automatically!",
          embeds: [
            {
              title: ad.title || "Automatic Sponsored Content",
              description: ad.text || "Check out this automatic offer!",
              url: ad.url || "https://discord.com",
              color: 5865242,
              fields: [
                {
                  name: "💰 Automatic Earning System",
                  value: "You earn money automatically for every ad view!",
                  inline: false
                },
                {
                  name: "🤖 System Status",
                  value: "Fully Automated • 24/7 Operation",
                  inline: true
                }
              ],
              footer: {
                text: "💰 Automatic DiscordAdNet - Earning money automatically!"
              },
              timestamp: new Date().toISOString()
            }
          ]
        }

        if (ad.image_url) {
          discordMessage.embeds[0].image = { url: ad.image_url }
        }

        console.log(`📤 AUTOMATIC: Sending "${ad.title}" to ${webhook.server_name}`)

        // Send to Discord webhook with enhanced error handling
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-AutoBot/2.0'
          },
          body: JSON.stringify(discordMessage)
        })

        console.log(`📡 AUTOMATIC: Discord response for ${webhook.server_name}: ${response.status}`)

        if (response.ok) {
          totalSent++
          totalEarnings += earnedAmount
          
          console.log(`💰 AUTOMATIC: Processing earnings for user ${webhook.user_id}`)
          
          // DIRECT balance update with comprehensive logging
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', webhook.user_id)
            .single()

          if (!getUserError && currentUser) {
            const currentBalance = currentUser.balance || 0
            const newBalance = Number((currentBalance + earnedAmount).toFixed(8))
            
            console.log(`💰 AUTOMATIC: User ${webhook.user_id}: $${currentBalance} → $${newBalance}`)
            
            const { error: balanceError } = await supabase
              .from('users')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', webhook.user_id)
            
            if (!balanceError) {
              console.log(`✅ AUTOMATIC: Balance updated successfully for user ${webhook.user_id}`)
              
              // Verification step
              const { data: verifyUser } = await supabase
                .from('users')
                .select('balance')
                .eq('id', webhook.user_id)
                .single()

              if (verifyUser) {
                console.log(`✅ AUTOMATIC: Verified new balance: $${verifyUser.balance}`)
              }
            } else {
              console.error(`❌ AUTOMATIC: Balance update failed:`, balanceError)
            }
          }

          // Update ad impressions
          await supabase
            .from('ads')
            .update({ impressions: (ad.impressions || 0) + 1 })
            .eq('id', ad.id)

          // Update webhook success stats
          await supabase
            .from('webhooks')
            .update({ 
              total_sent: (webhook.total_sent || 0) + 1,
              last_success_at: new Date().toISOString(),
              last_sent_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', webhook.id)

          // Log successful automatic delivery
          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              earning_amount: earnedAmount
            })

          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })

          console.log(`✅ AUTOMATIC: Success for ${webhook.server_name}, earned $${earnedAmount}`)

        } else {
          const responseText = await response.text()
          totalErrors++
          console.error(`❌ AUTOMATIC: Failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Log errors with automatic recovery
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: `${response.status}: ${responseText}`
            })
            .eq('id', webhook.id)

          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`
            })

          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`,
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })
        }
      } catch (error) {
        totalErrors++
        console.error(`💥 AUTOMATIC: Exception for webhook ${webhook.server_name}:`, error)
        
        // Log errors but continue
        await supabase
          .from('webhooks')
          .update({ 
            total_errors: (webhook.total_errors || 0) + 1,
            last_sent_at: new Date().toISOString(),
            last_error: error.message
          })
          .eq('id', webhook.id)

        await supabase
          .from('ad_deliveries')
          .insert({
            webhook_id: webhook.id,
            ad_id: ad.id,
            status: 'error',
            error_message: error.message
          })
      }

      // Automatic pacing - small delay between sends
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    const summary = {
      success: true,
      message: `AUTOMATIC distribution complete: ${totalSent} successful, ${totalErrors} errors`,
      automated: isAutomated,
      mode: 'FULLY_AUTOMATIC',
      timestamp: new Date().toISOString(),
      stats: {
        adsDistributed: ads.length,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        totalEarnings: Number(totalEarnings.toFixed(8)),
        runType: 'automatic'
      }
    }

    console.log(`🎯 AUTOMATIC distribution COMPLETE!`)
    console.log(`📊 AUTOMATIC STATS: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`💰 AUTOMATIC EARNINGS: $${totalEarnings.toFixed(8)} distributed`)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 AUTOMATIC DISTRIBUTION CRITICAL ERROR:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        automated: true,
        mode: 'AUTOMATIC_ERROR',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
