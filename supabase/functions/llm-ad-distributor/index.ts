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

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured')
    }

    console.log('🤖 Starting LLM-powered ad distribution cycle...')

    // Get a random public ad
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')
      .limit(10)

    if (adsError) {
      console.error('❌ Error fetching ads:', adsError)
      throw adsError
    }

    if (!ads || ads.length === 0) {
      console.log('⚠️ No public ads available')
      return new Response(
        JSON.stringify({ message: 'No public ads available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Select a random ad
    const ad = ads[Math.floor(Math.random() * ads.length)]
    console.log(`📄 Selected ad: "${ad.title}"`)

    // Send ad text to OpenRouter LLM
    console.log('🤖 Sending ad to LLM for processing...')
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://discord-ad-net.com',
        'X-Title': 'Discord Ad Network'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps optimize advertising content. Analyze the provided ad and respond with 'CONTINUE' if the ad should be distributed to Discord channels, or provide suggestions for improvement."
          },
          {
            role: "user",
            content: `Please analyze this advertisement:
Title: ${ad.title || 'No title'}
Description: ${ad.text || 'No description'}
URL: ${ad.url || 'No URL'}

Should this ad be distributed? Respond with 'CONTINUE' if yes, or provide brief feedback.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      console.error('❌ LLM API error:', llmResponse.status, errorText)
      throw new Error(`LLM API error: ${llmResponse.status} - ${errorText}`)
    }

    const llmData = await llmResponse.json()
    const aiDecision = llmData.choices?.[0]?.message?.content || 'CONTINUE'
    
    console.log('🤖 LLM Response:', aiDecision)

    // If AI says continue or gives positive feedback, distribute the ad
    if (aiDecision.includes('CONTINUE') || aiDecision.length < 50) {
      console.log('✅ LLM approved ad distribution, proceeding...')
      
      // Get active webhooks
      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .limit(5) // Limit to prevent overwhelming

      if (webhooksError) {
        console.error('❌ Error fetching webhooks:', webhooksError)
        throw webhooksError
      }

      if (!webhooks || webhooks.length === 0) {
        console.log('⚠️ No active webhooks found')
        return new Response(
          JSON.stringify({ message: 'No active webhooks found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let successCount = 0
      const earnedAmount = 0.00001

      // Distribute to Discord webhooks
      for (const webhook of webhooks) {
        try {
          const discordMessage = {
            content: "🤖 **AI-Approved Sponsored Content**",
            embeds: [
              {
                title: ad.title || "Sponsored Content",
                description: ad.text || "Check out this offer!",
                url: ad.url || "https://discord.com",
                color: 5865242,
                fields: [
                  {
                    name: "🤖 AI Analysis",
                    value: aiDecision.substring(0, 100) + (aiDecision.length > 100 ? '...' : ''),
                    inline: false
                  },
                  {
                    name: "💰 Earnings",
                    value: `$${earnedAmount} per ad delivery`,
                    inline: true
                  }
                ],
                footer: {
                  text: "🤖 AI-Powered DiscordAdNet"
                },
                timestamp: new Date().toISOString()
              }
            ]
          }

          if (ad.image_url) {
            discordMessage.embeds[0].image = { url: ad.image_url }
          }

          console.log(`📤 Sending to ${webhook.server_name}...`)

          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DiscordAdNet-LLM-Bot/1.0'
            },
            body: JSON.stringify(discordMessage)
          })

          if (response.ok) {
            successCount++
            console.log(`✅ Successfully sent to ${webhook.server_name}`)

            // Update user balance
            const { data: currentUser } = await supabase
              .from('users')
              .select('balance')
              .eq('id', webhook.user_id)
              .single()

            if (currentUser) {
              const newBalance = Number(((currentUser.balance || 0) + earnedAmount).toFixed(8))
              
              await supabase
                .from('users')
                .update({ 
                  balance: newBalance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', webhook.user_id)

              console.log(`💰 Updated balance for user ${webhook.user_id}: +$${earnedAmount}`)
            }

            // Log successful delivery
            await supabase
              .from('ad_deliveries')
              .insert({
                webhook_id: webhook.id,
                ad_id: ad.id,
                status: 'success',
                earning_amount: earnedAmount
              })

            // Update webhook stats
            await supabase
              .from('webhooks')
              .update({ 
                total_sent: (webhook.total_sent || 0) + 1,
                last_success_at: new Date().toISOString(),
                last_sent_at: new Date().toISOString()
              })
              .eq('id', webhook.id)

          } else {
            const errorText = await response.text()
            console.error(`❌ Failed to send to ${webhook.server_name}:`, response.status, errorText)
            
            await supabase
              .from('webhooks')
              .update({ 
                total_errors: (webhook.total_errors || 0) + 1,
                last_sent_at: new Date().toISOString(),
                last_error: `${response.status}: ${errorText}`
              })
              .eq('id', webhook.id)
          }
        } catch (error) {
          console.error(`💥 Exception for webhook ${webhook.server_name}:`, error)
        }

        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Update ad impressions
      await supabase
        .from('ads')
        .update({ impressions: (ad.impressions || 0) + successCount })
        .eq('id', ad.id)

      console.log(`🎯 Distribution complete: ${successCount}/${webhooks.length} successful`)

      // Schedule next cycle (1 minute delay)
      console.log('⏰ Scheduling next cycle in 1 minute...')
      setTimeout(async () => {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/llm-ad-distributor`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ continuous: true })
          })
          console.log('🔄 Next cycle triggered')
        } catch (error) {
          console.error('❌ Failed to trigger next cycle:', error)
        }
      }, 60000) // 1 minute

      return new Response(
        JSON.stringify({
          success: true,
          message: `LLM-powered distribution complete: ${successCount} successful deliveries`,
          aiDecision: aiDecision,
          adTitle: ad.title,
          successCount: successCount,
          totalWebhooks: webhooks.length,
          nextCycleIn: '1 minute'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      console.log('🚫 LLM did not approve ad distribution')
      console.log('🤖 LLM Feedback:', aiDecision)
      
      // Schedule next cycle anyway to keep the system running
      setTimeout(async () => {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/llm-ad-distributor`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ continuous: true })
          })
          console.log('🔄 Next cycle triggered (ad was not approved)')
        } catch (error) {
          console.error('❌ Failed to trigger next cycle:', error)
        }
      }, 60000) // 1 minute

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Ad not approved by LLM',
          aiDecision: aiDecision,
          adTitle: ad.title,
          nextCycleIn: '1 minute'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('💥 LLM Distribution Error:', error)
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
