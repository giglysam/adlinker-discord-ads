
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

    console.log('Starting automated ad distribution...')

    // Get all public ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`Found ${ads?.length || 0} public ads`)

    // Get all active webhooks (only real, verified ones)
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError)
      throw webhooksError
    }

    console.log(`Found ${webhooks?.length || 0} active webhooks`)

    if (!ads || ads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No public ads to distribute' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active webhooks to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let errorCount = 0

    // Distribute ads to all active webhooks
    for (const webhook of webhooks) {
      // Select a random ad for variety
      const randomAd = ads[Math.floor(Math.random() * ads.length)]
      
      try {
        // Create properly formatted Discord embed message
        const discordMessage = {
          embeds: [{
            title: `🎯 ${randomAd.title}`,
            description: randomAd.text,
            color: 0x5865F2, // Discord Blurple
            image: randomAd.image_url ? {
              url: randomAd.image_url
            } : undefined,
            fields: [
              {
                name: "🔗 Visit Now",
                value: `[Click here to learn more](${randomAd.url})`,
                inline: false
              }
            ],
            footer: {
              text: "💰 Sponsored by DiscordAdNet - You're earning money by viewing this!"
            },
            timestamp: new Date().toISOString()
          }]
        }

        console.log(`Sending ad "${randomAd.title}" to webhook ${webhook.server_name}`)

        // Send to Discord webhook with proper headers
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-Bot/1.0'
          },
          body: JSON.stringify(discordMessage)
        })

        const responseText = await response.text()
        console.log(`Discord API Response: ${response.status} - ${responseText}`)

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

          // Award earnings to user (important!)
          const earnedAmount = 0.00001 // $0.00001 per successful ad delivery
          await supabase.rpc('increment_user_balance', {
            user_id: webhook.user_id,
            amount: earnedAmount
          })

          console.log(`✅ Successfully sent ad to ${webhook.server_name}, user earned $${earnedAmount}`)

        } else {
          errorCount++
          console.error(`❌ Webhook delivery failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Update webhook error stats but don't deactivate - let user decide
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_error: `${response.status}: ${responseText.slice(0, 200)}`,
              last_sent_at: new Date().toISOString()
            })
            .eq('id', webhook.id)

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
        console.error(`💥 Error sending to webhook ${webhook.server_name}:`, error)
        
        // Update webhook error stats
        await supabase
          .from('webhooks')
          .update({ 
            total_errors: (webhook.total_errors || 0) + 1,
            last_error: error.message.slice(0, 200),
            last_sent_at: new Date().toISOString()
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

    console.log(`🎯 Ad distribution complete. Success: ${successCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully distributed ads to ${successCount} webhooks with ${errorCount} errors`,
        successCount,
        errorCount,
        totalWebhooks: webhooks.length,
        totalAds: ads.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
