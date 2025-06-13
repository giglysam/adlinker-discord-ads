
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

    console.log('🚀 Starting sequential ad distribution to all webhook slots...')

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
    let deletedWebhooks = 0

    console.log(`🎯 Starting sequential distribution to ${webhooks.length} webhook slots...`)
    console.log(`📅 Will send ${ads.length} ads to each webhook with 3-minute intervals`)

    // Send ALL ads to ALL webhooks sequentially
    for (let adIndex = 0; adIndex < ads.length; adIndex++) {
      const currentAd = ads[adIndex]
      console.log(`\n📢 Processing ad ${adIndex + 1}/${ads.length}: "${currentAd.title}"`)

      for (const webhook of webhooks) {
        try {
          // Create properly formatted Discord embed message
          const discordMessage = {
            content: "💰 **New Sponsored Content** - You're earning money by viewing this!",
            embeds: [{
              title: currentAd.title || "Sponsored Content",
              description: currentAd.text || "Check out this amazing offer!",
              url: currentAd.url || "https://discord.com",
              color: 0x5865F2, // Discord Blurple color in hex format
              fields: [
                {
                  name: "💰 Earning Opportunity",
                  value: "You earn money for every ad view!",
                  inline: false
                }
              ],
              footer: {
                text: "💰 Sponsored by DiscordAdNet - You're earning money!",
                icon_url: "https://cdn.discordapp.com/emojis/741203895585292359.png"
              },
              timestamp: new Date().toISOString()
            }]
          }

          // Add image if available
          if (currentAd.image_url) {
            discordMessage.embeds[0].image = {
              url: currentAd.image_url
            }
          }

          console.log(`📤 Sending ad "${currentAd.title}" to webhook: ${webhook.server_name}`)
          console.log(`🔗 Webhook URL: ${webhook.webhook_url.substring(0, 50)}...`)

          // Send to Discord webhook
          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DiscordAdNet-Bot/1.0'
            },
            body: JSON.stringify(discordMessage)
          })

          const responseText = await response.text()
          console.log(`📡 Discord API Response for ${webhook.server_name}: ${response.status}`)

          if (response.ok) {
            totalSent++
            
            // Update impression count for the ad
            await supabase
              .from('ads')
              .update({ impressions: (currentAd.impressions || 0) + 1 })
              .eq('id', currentAd.id)

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
                ad_id: currentAd.id,
                status: 'success',
                earning_amount: 0.00001
              })

            // Log to webhook_logs for monitoring
            await supabase
              .from('webhook_logs')
              .insert({
                webhook_id: webhook.id,
                ad_id: currentAd.id,
                status: 'success',
                response_status: response.status,
                delivered_at: new Date().toISOString()
              })

            // Award earnings to user
            const earnedAmount = 0.00001
            await supabase.rpc('increment_user_balance', {
              user_id: webhook.user_id,
              amount: earnedAmount
            })

            console.log(`✅ Successfully sent ad to ${webhook.server_name}, user earned $${earnedAmount}`)

          } else {
            totalErrors++
            console.error(`❌ Webhook delivery failed for ${webhook.server_name}:`, response.status, responseText)
            
            // Update webhook error stats
            await supabase
              .from('webhooks')
              .update({ 
                total_errors: (webhook.total_errors || 0) + 1,
                last_sent_at: new Date().toISOString(),
                last_error: `${response.status}: ${responseText}`
              })
              .eq('id', webhook.id)

            // Only delete webhook if it has consistently failed (more than 10 errors and error rate > 90%)
            const totalAttempts = (webhook.total_sent || 0) + (webhook.total_errors || 0) + 1
            const errorRate = ((webhook.total_errors || 0) + 1) / totalAttempts

            if (totalAttempts >= 10 && errorRate > 0.9) {
              console.log(`🗑️ Deleting webhook ${webhook.server_name} due to consistent failures`)
              
              const { error: deleteError } = await supabase
                .from('webhooks')
                .delete()
                .eq('id', webhook.id)

              if (!deleteError) {
                deletedWebhooks++
              }
            }

            // Log failed delivery
            await supabase
              .from('ad_deliveries')
              .insert({
                webhook_id: webhook.id,
                ad_id: currentAd.id,
                status: 'error',
                error_message: `${response.status}: ${responseText}`
              })

            await supabase
              .from('webhook_logs')
              .insert({
                webhook_id: webhook.id,
                ad_id: currentAd.id,
                status: 'error',
                error_message: `${response.status}: ${responseText}`,
                response_status: response.status,
                delivered_at: new Date().toISOString()
              })
          }
        } catch (error) {
          totalErrors++
          console.error(`💥 Error sending to webhook ${webhook.server_name}:`, error)
          
          // Update error stats
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: error.message
            })
            .eq('id', webhook.id)

          // Log error
          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: currentAd.id,
              status: 'error',
              error_message: error.message
            })

          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: currentAd.id,
              status: 'error',
              error_message: error.message,
              delivered_at: new Date().toISOString()
            })
        }

        // Small delay between webhook calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // 3-minute delay between ads (except for the last ad)
      if (adIndex < ads.length - 1) {
        console.log(`⏰ Waiting 3 minutes before sending next ad...`)
        await new Promise(resolve => setTimeout(resolve, 180000)) // 3 minutes = 180,000ms
      }
    }

    console.log(`🎯 Sequential ad distribution complete!`)
    console.log(`📊 Total deliveries: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`🗑️ Deleted ${deletedWebhooks} consistently failing webhooks`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully distributed ${ads.length} ads to ${webhooks.length} webhook slots. Total deliveries: ${totalSent} successful, ${totalErrors} errors.`,
        adsDistributed: ads.length,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        deletedWebhooks: deletedWebhooks,
        details: `Sent all ${ads.length} ads sequentially to all ${webhooks.length} active webhook slots with 3-minute intervals between ads.`
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
