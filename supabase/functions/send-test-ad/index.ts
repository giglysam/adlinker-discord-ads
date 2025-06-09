
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

    // Create test ad message
    const testMessage = {
      embeds: [{
        title: "🎯 Test Advertisement - DiscordAdNet",
        description: "This is a test message to verify your webhook is working correctly!",
        color: 0x5865F2,
        fields: [
          {
            name: "✅ Webhook Status",
            value: "Your webhook is configured correctly and ready to receive ads!",
            inline: false
          },
          {
            name: "💰 Earning Potential",
            value: "You'll earn money for each ad displayed in your server.",
            inline: false
          }
        ],
        footer: {
          text: "DiscordAdNet - Premium Discord Advertising Platform"
        },
        timestamp: new Date().toISOString()
      }]
    }

    console.log('Sending test message to webhook:', webhookUrl)

    // Send message to Discord webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord webhook error:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: `Webhook failed: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Test message sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test message sent successfully'
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
