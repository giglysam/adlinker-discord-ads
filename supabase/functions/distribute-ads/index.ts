
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

    console.log('🚀 CONTINUOUS ad distribution starting...')

    // Get all public ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('❌ Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`📊 Found ${ads?.length || 0} public ads for CONTINUOUS distribution`)

    // Get ALL ACTIVE webhooks from the database
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('❌ Error fetching webhook slots:', webhooksError)
      throw webhooksError
    }

    console.log(`📊 Found ${webhooks?.length || 0} active webhook slots for CONTINUOUS distribution`)

    if (!ads || ads.length === 0) {
      console.log('⚠️ No public ads to distribute in CONTINUOUS mode')
      return new Response(
        JSON.stringify({ message: 'No public ads to distribute - CONTINUOUS mode active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ No active webhook slots found in CONTINUOUS mode')
      return new Response(
        JSON.stringify({ message: 'No active webhook slots - CONTINUOUS mode active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSent = 0
    let totalErrors = 0
    let totalEarnings = 0
    const earnedAmount = 0.00001

    console.log(`🎯 CONTINUOUS distribution to ${webhooks.length} webhook slots...`)

    // Send one ad to each webhook (round-robin style)
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i]
      const ad = ads[i % ads.length] // Cycle through ads

      try {
        // Create Discord message
        const discordMessage = {
          content: "💰 **New Sponsored Content** - You're earning money by viewing this!",
          embeds: [
            {
              title: ad.title || "Sponsored Content",
              description: ad.text || "Check out this amazing offer!",
              url: ad.url || "https://discord.com",
              color: 5865242,
              fields: [
                {
                  name: "💰 Earning Opportunity",
                  value: "You earn money for every ad view!",
                  inline: false
                }
              ],
              footer: {
                text: "💰 Sponsored by DiscordAdNet - You're earning money!"
              },
              timestamp: new Date().toISOString()
            }
          ]
        }

        // Add image if available
        if (ad.image_url) {
          discordMessage.embeds[0].image = {
            url: ad.image_url
          }
        }

        console.log(`📤 CONTINUOUS: Sending ad "${ad.title}" to webhook: ${webhook.server_name}`)

        // Send to Discord webhook
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-Bot/1.0'
          },
          body: JSON.stringify(discordMessage)
        })

        console.log(`📡 CONTINUOUS: Discord response for ${webhook.server_name}: ${response.status}`)

        if (response.ok) {
          totalSent++
          totalEarnings += earnedAmount
          
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

          // Log successful delivery
          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              earning_amount: earnedAmount
            })

          // Log to webhook_logs
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })

          // **CRITICAL: DIRECT BALANCE UPDATE WITH VERIFICATION**
          console.log(`💰 CONTINUOUS: Awarding $${earnedAmount} to user ${webhook.user_id}`)
          
          // Get current balance first
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', webhook.user_id)
            .single()

          if (!getUserError && currentUser) {
            const currentBalance = currentUser?.balance || 0
            const newBalance = Number((currentBalance + earnedAmount).toFixed(8)) // Prevent floating point issues
            
            console.log(`💰 CONTINUOUS: User ${webhook.user_id}: $${currentBalance} → $${newBalance}`)
            
            // Update user balance with immediate verification
            const { error: balanceError } = await supabase
              .from('users')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', webhook.user_id)
            
            if (!balanceError) {
              console.log(`✅ CONTINUOUS: Balance updated successfully for user ${webhook.user_id}`)
              
              // Double-verify the update worked
              const { data: verifyUser } = await supabase
                .from('users')
                .select('balance')
                .eq('id', webhook.user_id)
                .single()

              if (verifyUser) {
                console.log(`✅ CONTINUOUS: Verified balance is now: $${verifyUser.balance}`)
              }
            } else {
              console.error(`❌ CONTINUOUS: Balance update failed:`, balanceError)
            }
          } else {
            console.error(`❌ CONTINUOUS: Could not get current user balance:`, getUserError)
          }

          console.log(`✅ CONTINUOUS: Successfully sent ad to ${webhook.server_name}, user earned $${earnedAmount}`)

        } else {
          const responseText = await response.text()
          totalErrors++
          console.error(`❌ CONTINUOUS: Failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Update webhook error stats
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: `${response.status}: ${responseText}`
            })
            .eq('id', webhook.id)

          // Log failed delivery
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
        console.error(`💥 CONTINUOUS: Error sending to webhook ${webhook.server_name}:`, error)
        
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

      // Small delay between webhook calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`🎯 CONTINUOUS distribution complete!`)
    console.log(`📊 CONTINUOUS stats: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`💰 CONTINUOUS earnings distributed: $${totalEarnings.toFixed(8)}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `CONTINUOUS distribution complete: ${totalSent} successful, ${totalErrors} errors`,
        mode: 'CONTINUOUS',
        adsDistributed: ads.length,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        totalEarnings: totalEarnings,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 CONTINUOUS distribution error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        mode: 'CONTINUOUS'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
