
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
    const isInfinite = requestBody.infinite || requestBody.automated || requestBody.continuous

    console.log('🚀 INFINITE ad distribution starting...', { 
      infinite: isInfinite, 
      timestamp: new Date().toISOString() 
    })

    // Get all public ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('❌ INFINITE: Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`📊 INFINITE: Found ${ads?.length || 0} public ads for infinite distribution`)

    // Get ALL ACTIVE webhooks
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('❌ INFINITE: Error fetching webhooks:', webhooksError)
      throw webhooksError
    }

    console.log(`📊 INFINITE: Found ${webhooks?.length || 0} active webhooks for infinite distribution`)

    if (!ads || ads.length === 0) {
      console.log('⚠️ INFINITE: No public ads to distribute - but continuing infinite loop')
      return new Response(
        JSON.stringify({ 
          message: 'No public ads available but infinite system continues',
          infinite: isInfinite,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ INFINITE: No active webhooks found - but continuing infinite loop')
      return new Response(
        JSON.stringify({ 
          message: 'No active webhooks but infinite system continues',
          infinite: isInfinite,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSent = 0
    let totalErrors = 0
    let totalEarnings = 0
    const earnedAmount = 0.00001

    console.log(`🎯 INFINITE: Starting infinite distribution to ${webhooks.length} webhooks...`)

    // Enhanced infinite distribution process
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i]
      const ad = ads[i % ads.length] // Cycle through ads infinitely

      try {
        // Create enhanced Discord message for infinite system
        const discordMessage = {
          content: "♾️ **INFINITE Sponsored Content** - Earning money infinitely!",
          embeds: [
            {
              title: ad.title || "Infinite Sponsored Content",
              description: ad.text || "Check out this infinite offer!",
              url: ad.url || "https://discord.com",
              color: 5865242,
              fields: [
                {
                  name: "♾️ Infinite Earning System",
                  value: "You earn money infinitely for every ad view!",
                  inline: false
                },
                {
                  name: "🔄 System Status", 
                  value: "Infinite Loop Active • Never Stops",
                  inline: true
                }
              ],
              footer: {
                text: "♾️ Infinite DiscordAdNet - Earning money forever!"
              },
              timestamp: new Date().toISOString()
            }
          ]
        }

        if (ad.image_url) {
          discordMessage.embeds[0].image = { url: ad.image_url }
        }

        console.log(`📤 INFINITE: Sending "${ad.title}" to ${webhook.server_name}`)

        // Send to Discord webhook
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-InfiniteBot/3.0'
          },
          body: JSON.stringify(discordMessage)
        })

        console.log(`📡 INFINITE: Discord response for ${webhook.server_name}: ${response.status}`)

        if (response.ok) {
          totalSent++
          totalEarnings += earnedAmount
          
          console.log(`💰 INFINITE: Processing infinite earnings for user ${webhook.user_id}`)
          
          // DIRECT balance update with infinite logging
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', webhook.user_id)
            .single()

          if (!getUserError && currentUser) {
            const currentBalance = currentUser.balance || 0
            const newBalance = Number((currentBalance + earnedAmount).toFixed(8))
            
            console.log(`💰 INFINITE: User ${webhook.user_id}: $${currentBalance} → $${newBalance}`)
            
            const { error: balanceError } = await supabase
              .from('users')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', webhook.user_id)
            
            if (!balanceError) {
              console.log(`✅ INFINITE: Balance updated successfully for user ${webhook.user_id}`)
              
              // Verification step for infinite system
              const { data: verifyUser } = await supabase
                .from('users')
                .select('balance')
                .eq('id', webhook.user_id)
                .single()

              if (verifyUser) {
                console.log(`✅ INFINITE: Verified new infinite balance: $${verifyUser.balance}`)
              }
            } else {
              console.error(`❌ INFINITE: Balance update failed:`, balanceError)
            }
          }

          // Update ad impressions for infinite tracking
          await supabase
            .from('ads')
            .update({ impressions: (ad.impressions || 0) + 1 })
            .eq('id', ad.id)

          // Update webhook success stats for infinite system
          await supabase
            .from('webhooks')
            .update({ 
              total_sent: (webhook.total_sent || 0) + 1,
              last_success_at: new Date().toISOString(),
              last_sent_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', webhook.id)

          // Log successful infinite delivery
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

          console.log(`✅ INFINITE: Success for ${webhook.server_name}, earned $${earnedAmount}`)

        } else {
          const responseText = await response.text()
          totalErrors++
          console.error(`❌ INFINITE: Failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Log errors for infinite system but continue
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
        console.error(`💥 INFINITE: Exception for webhook ${webhook.server_name}:`, error)
        
        // Log errors but continue infinite operation
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

      // Infinite pacing - small delay between sends
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const summary = {
      success: true,
      message: `INFINITE distribution complete: ${totalSent} successful, ${totalErrors} errors`,
      infinite: isInfinite,
      mode: 'INFINITE_OPERATION',
      timestamp: new Date().toISOString(),
      stats: {
        adsDistributed: ads.length,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        totalEarnings: Number(totalEarnings.toFixed(8)),
        runType: 'infinite'
      }
    }

    console.log(`🎯 INFINITE distribution COMPLETE!`)
    console.log(`📊 INFINITE STATS: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`💰 INFINITE EARNINGS: $${totalEarnings.toFixed(8)} distributed`)
    console.log(`♾️ INFINITE SYSTEM CONTINUES FOREVER!`)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 INFINITE DISTRIBUTION CRITICAL ERROR:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        infinite: true,
        mode: 'INFINITE_ERROR_RECOVERY',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
