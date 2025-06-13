
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

    console.log('🚀 Starting automated ad distribution to real webhook slots...')

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

    // Get ONLY ACTIVE webhooks from the database (real user-created webhook slots)
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

    let successCount = 0
    let errorCount = 0
    let deletedWebhooks = 0

    console.log(`🎯 Starting distribution to ${webhooks.length} real webhook slots...`)

    // Distribute ads to all active webhook slots
    for (const webhook of webhooks) {
      // Select a random ad for variety
      const randomAd = ads[Math.floor(Math.random() * ads.length)]
      
      try {
        // Create Discord embed message with PROPER format that Discord accepts
        const discordMessage = {
          content: "💰 New sponsored content - You're earning money by viewing this!",
          embeds: [{
            title: randomAd.title || "Sponsored Content",
            url: randomAd.url || "https://discord.com",
            description: randomAd.text || "Check out this amazing offer!",
            color: 5814783, // Discord Blurple as integer, not hex
            ...(randomAd.image_url && {
              image: {
                url: randomAd.image_url
              }
            }),
            footer: {
              text: "💰 Sponsored by DiscordAdNet - You're earning money!"
            },
            timestamp: new Date().toISOString()
          }]
        }

        console.log(`📤 Sending ad "${randomAd.title}" to webhook slot ${webhook.server_name}`)

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
        console.log(`📡 Discord API Response for ${webhook.server_name}: ${response.status} - ${responseText}`)

        if (response.ok) {
          successCount++
          
          // Update impression count for the ad
          await supabase
            .from('ads')
            .update({ impressions: (randomAd.impressions || 0) + 1 })
            .eq('id', randomAd.id)

          // Update webhook success stats
          await supabase
            .from('webhooks')
            .update({ 
              total_sent: (webhook.total_sent || 0) + 1,
              last_success_at: new Date().toISOString(),
              last_sent_at: new Date().toISOString(),
              last_error: null // Clear any previous errors
            })
            .eq('id', webhook.id)

          // Log successful delivery
          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
              status: 'success',
              earning_amount: 0.00001
            })

          // Log to webhook_logs for monitoring
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
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
          errorCount++
          console.error(`❌ Webhook delivery failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Update webhook error stats but DON'T delete immediately - give it a chance
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: `${response.status}: ${responseText}`
            })
            .eq('id', webhook.id)

          // Only delete if error rate is too high (more than 80% errors)
          const totalAttempts = (webhook.total_sent || 0) + (webhook.total_errors || 0) + 1
          const errorRate = ((webhook.total_errors || 0) + 1) / totalAttempts

          if (totalAttempts >= 5 && errorRate > 0.8) {
            console.log(`🗑️ Deleting webhook slot ${webhook.server_name} due to high error rate (${(errorRate * 100).toFixed(1)}%)`)
            
            const { error: deleteError } = await supabase
              .from('webhooks')
              .delete()
              .eq('id', webhook.id)

            if (deleteError) {
              console.error(`Failed to delete webhook ${webhook.server_name}:`, deleteError)
            } else {
              deletedWebhooks++
              console.log(`✅ Successfully deleted failed webhook slot ${webhook.server_name}`)
            }
          }

          // Log failed delivery
          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`
            })

          // Log to webhook_logs for monitoring
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`,
              response_status: response.status,
              delivered_at: new Date().toISOString()
            })
        }
      } catch (error) {
        errorCount++
        console.error(`💥 Error sending to webhook slot ${webhook.server_name}:`, error)
        
        // Update error stats
        await supabase
          .from('webhooks')
          .update({ 
            total_errors: (webhook.total_errors || 0) + 1,
            last_sent_at: new Date().toISOString(),
            last_error: error.message
          })
          .eq('id', webhook.id)

        // Log error to deliveries and logs
        await supabase
          .from('ad_deliveries')
          .insert({
            webhook_id: webhook.id,
            ad_id: randomAd.id,
            status: 'error',
            error_message: error.message
          })

        await supabase
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            ad_id: randomAd.id,
            status: 'error',
            error_message: error.message,
            delivered_at: new Date().toISOString()
          })
      }

      // Small delay between webhook calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`🎯 Ad distribution complete! ✅ Success: ${successCount}, ❌ Errors: ${errorCount}, 🗑️ Deleted: ${deletedWebhooks}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully distributed ads to ${successCount} webhook slots with ${errorCount} errors. Deleted ${deletedWebhooks} failed webhooks.`,
        successCount,
        errorCount,
        deletedWebhooks,
        totalWebhooks: webhooks.length,
        totalAds: ads.length,
        details: `Sent ads to ${successCount}/${webhooks.length} active webhook slots. Deleted ${deletedWebhooks} failed webhooks only after high error rate.`
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
