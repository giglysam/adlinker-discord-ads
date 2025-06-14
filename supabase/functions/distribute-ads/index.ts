
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

    console.log('🚀 Starting ad distribution to all webhook slots...')

    // Get all public ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('❌ Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`📊 Found ${ads?.length || 0} public ads`)

    // Get ALL ACTIVE webhooks from the database
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('❌ Error fetching webhook slots:', webhooksError)
      throw webhooksError
    }

    console.log(`📊 Found ${webhooks?.length || 0} active webhook slots in database`)

    if (!ads || ads.length === 0) {
      console.log('⚠️ No public ads to distribute')
      return new Response(
        JSON.stringify({ message: 'No public ads to distribute' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ No active webhook slots found in database')
      return new Response(
        JSON.stringify({ message: 'No active webhook slots to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSent = 0
    let totalErrors = 0
    let totalEarnings = 0

    console.log(`🎯 Starting distribution to ${webhooks.length} webhook slots...`)

    // Send one ad to each webhook (round-robin style)
    for (let i = 0; i < webhooks.length; i++) {
      const webhook = webhooks[i]
      const ad = ads[i % ads.length] // Cycle through ads

      try {
        // Create the same Discord message format as the test webhook
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

        console.log(`📤 Sending ad "${ad.title}" to webhook: ${webhook.server_name}`)

        // Send to Discord webhook using the exact same method as test
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-Bot/1.0'
          },
          body: JSON.stringify(discordMessage)
        })

        console.log(`📡 Discord API Response for ${webhook.server_name}: ${response.status}`)

        if (response.ok) {
          totalSent++
          const earnedAmount = 0.00001
          totalEarnings += earnedAmount
          
          // Update impression count for the ad
          const { error: adUpdateError } = await supabase
            .from('ads')
            .update({ impressions: (ad.impressions || 0) + 1 })
            .eq('id', ad.id)

          if (adUpdateError) {
            console.error('❌ Error updating ad impressions:', adUpdateError)
          }

          // Update webhook success stats
          const { error: webhookUpdateError } = await supabase
            .from('webhooks')
            .update({ 
              total_sent: (webhook.total_sent || 0) + 1,
              last_success_at: new Date().toISOString(),
              last_sent_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', webhook.id)

          if (webhookUpdateError) {
            console.error('❌ Error updating webhook stats:', webhookUpdateError)
          }

          // Log successful delivery
          const { error: deliveryLogError } = await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              earning_amount: earnedAmount
            })

          if (deliveryLogError) {
            console.error('❌ Error logging delivery:', deliveryLogError)
          }

          // Log to webhook_logs for monitoring
          const { error: webhookLogError } = await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'success',
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })

          if (webhookLogError) {
            console.error('❌ Error logging webhook activity:', webhookLogError)
          }

          // **DIRECT BALANCE UPDATE** - Award earnings to user using direct SQL update
          console.log(`💰 Awarding $${earnedAmount} to user ${webhook.user_id}`)
          
          // Get current balance first
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', webhook.user_id)
            .single()

          if (getUserError) {
            console.error(`❌ Error getting current user balance for ${webhook.user_id}:`, getUserError)
          } else {
            const currentBalance = currentUser?.balance || 0
            const newBalance = currentBalance + earnedAmount
            
            console.log(`💰 User ${webhook.user_id}: Current balance: $${currentBalance}, Adding: $${earnedAmount}, New balance: $${newBalance}`)
            
            // Update user balance directly
            const { error: balanceError } = await supabase
              .from('users')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', webhook.user_id)
            
            if (balanceError) {
              console.error(`❌ Error updating user balance for ${webhook.user_id}:`, balanceError)
            } else {
              console.log(`✅ Successfully updated balance for user ${webhook.user_id} to $${newBalance}`)
              
              // Verify the update worked
              const { data: verifyUser, error: verifyError } = await supabase
                .from('users')
                .select('balance')
                .eq('id', webhook.user_id)
                .single()

              if (!verifyError && verifyUser) {
                console.log(`✅ Verified: User ${webhook.user_id} balance is now: $${verifyUser.balance}`)
              }
            }
          }

          console.log(`✅ Successfully sent ad to ${webhook.server_name}, user earned $${earnedAmount}`)

        } else {
          const responseText = await response.text()
          totalErrors++
          console.error(`❌ Webhook delivery failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Update webhook error stats
          const { error: webhookErrorUpdate } = await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: `${response.status}: ${responseText}`
            })
            .eq('id', webhook.id)

          if (webhookErrorUpdate) {
            console.error('❌ Error updating webhook error stats:', webhookErrorUpdate)
          }

          // Log failed delivery
          const { error: failedDeliveryError } = await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`
            })

          if (failedDeliveryError) {
            console.error('❌ Error logging failed delivery:', failedDeliveryError)
          }

          const { error: failedWebhookLogError } = await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: ad.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`,
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })

          if (failedWebhookLogError) {
            console.error('❌ Error logging failed webhook activity:', failedWebhookLogError)
          }
        }
      } catch (error) {
        totalErrors++
        console.error(`💥 Error sending to webhook ${webhook.server_name}:`, error)
        
        // Update error stats
        const { error: errorUpdateError } = await supabase
          .from('webhooks')
          .update({ 
            total_errors: (webhook.total_errors || 0) + 1,
            last_sent_at: new Date().toISOString(),
            last_error: error.message
          })
          .eq('id', webhook.id)

        if (errorUpdateError) {
          console.error('❌ Error updating webhook error stats:', errorUpdateError)
        }

        // Log error
        const { error: errorLogError } = await supabase
          .from('ad_deliveries')
          .insert({
            webhook_id: webhook.id,
            ad_id: ad.id,
            status: 'error',
            error_message: error.message
          })

        if (errorLogError) {
          console.error('❌ Error logging error delivery:', errorLogError)
        }

        const { error: errorWebhookLogError } = await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            ad_id: ad.id,
            status: 'error',
            error_message: error.message,
            delivered_at: new Date().toISOString()
          })

        if (errorWebhookLogError) {
          console.error('❌ Error logging error webhook activity:', errorWebhookLogError)
        }
      }

      // Small delay between webhook calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`🎯 Ad distribution complete!`)
    console.log(`📊 Total deliveries: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`💰 Total earnings distributed: $${totalEarnings.toFixed(5)}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully distributed ads to ${webhooks.length} webhook slots. Total deliveries: ${totalSent} successful, ${totalErrors} errors.`,
        adsDistributed: ads.length,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        totalEarnings: totalEarnings
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
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
