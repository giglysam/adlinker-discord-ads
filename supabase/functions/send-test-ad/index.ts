
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhookUrl } = await req.json()

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate Discord webhook URL format
    const discordWebhookRegex = /^https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/
    if (!discordWebhookRegex.test(webhookUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Discord webhook URL format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send test message to Discord
    const testMessage = {
      embeds: [{
        title: "🎉 Webhook Test Successful!",
        description: "Your Discord webhook is working perfectly! You're now ready to start receiving ads and earning money.",
        color: 0x00ff00, // Green
        fields: [
          {
            name: "✅ What's Next?",
            value: "Your webhook will now automatically receive ads every few minutes. You'll earn money for each ad delivered!",
            inline: false
          },
          {
            name: "💰 Earnings",
            value: "You earn $0.00001 for each successful ad delivery to your server.",
            inline: false
          }
        ],
        footer: {
          text: "🚀 DiscordAdNet - Webhook Test Complete"
        },
        timestamp: new Date().toISOString()
      }]
    }

    console.log('Sending test message to webhook:', webhookUrl.slice(0, 50) + '...')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordAdNet-Bot/1.0'
      },
      body: JSON.stringify(testMessage)
    })

    const responseText = await response.text()
    console.log(`Discord response: ${response.status} - ${responseText}`)

    if (response.ok) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Test message sent successfully!'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('Discord webhook test failed:', response.status, responseText)
      return new Response(
        JSON.stringify({ 
          error: `Webhook test failed: ${response.status} - ${responseText}`,
          success: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Test webhook error:', error)
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
