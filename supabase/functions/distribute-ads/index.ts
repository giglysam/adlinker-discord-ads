
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

    console.log('Starting ad distribution...')

    // Get all active ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`Found ${ads?.length || 0} active ads`)

    // Get all active webhooks
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('status', 'active')

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError)
      throw webhooksError
    }

    console.log(`Found ${webhooks?.length || 0} active webhooks`)

    if (!ads || ads.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active ads to distribute' }),
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

    // Distribute ads to webhooks
    for (const webhook of webhooks) {
      // Select a random ad
      const randomAd = ads[Math.floor(Math.random() * ads.length)]
      
      try {
        const adMessage = {
          embeds: [{
            title: randomAd.title,
            description: randomAd.text,
            color: 0x5865F2,
            image: {
              url: randomAd.image_url
            },
            fields: [
              {
                name: "🔗 Learn More",
                value: `[Click here to visit](${randomAd.url})`,
                inline: false
              }
            ],
            footer: {
              text: "💰 Sponsored by DiscordAdNet - Earn money by hosting ads!"
            },
            timestamp: new Date().toISOString()
          }]
        }

        console.log(`Sending ad "${randomAd.title}" to webhook ${webhook.server_name}`)

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adMessage)
        })

        if (response.ok) {
          successCount++
          
          // Update impression count
          await supabase
            .from('ads')
            .update({ impressions: (randomAd.impressions || 0) + 1 })
            .eq('id', randomAd.id)

          // Log successful delivery
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
              status: 'success',
              delivered_at: new Date().toISOString()
            })

          // Update user balance (earn money for showing ads)
          const earnedAmount = 0.00001 // $0.00001 per impression
          await supabase.rpc('increment_user_balance', {
            user_id: webhook.user_id,
            amount: earnedAmount
          })

        } else {
          errorCount++
          const errorText = await response.text()
          console.error(`Webhook delivery failed for ${webhook.server_name}:`, response.status, errorText)
          
          // Log failed delivery
          await supabase
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              ad_id: randomAd.id,
              status: 'error',
              error_message: `${response.status}: ${errorText}`,
              delivered_at: new Date().toISOString()
            })
        }
      } catch (error) {
        errorCount++
        console.error(`Error sending to webhook ${webhook.server_name}:`, error)
        
        // Log error
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

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Ad distribution complete. Success: ${successCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Distributed ads to ${successCount} webhooks with ${errorCount} errors`,
        successCount,
        errorCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
