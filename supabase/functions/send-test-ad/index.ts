
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

    // Validate Discord webhook URL format - more strict validation
    const discordWebhookRegex = /^https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d{17,19}\/[\w-]{68}$/
    if (!discordWebhookRegex.test(webhookUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Discord webhook URL format. Must be: https://discord.com/api/webhooks/ID/TOKEN' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send test message using the EXACT same format as the distribution function
    const testMessage = {
      embeds: [{
        title: "🔗 Webhook Connection Test - DiscordAdNet",
        description: "✅ Your Discord webhook is now connected and working perfectly! This webhook will now receive ads automatically and you'll start earning money.",
        color: 0x00ff00, // Green
        fields: [
          {
            name: "🎯 What happens next?",
            value: "• Your webhook will receive ads every few minutes\n• You earn $0.00001 for each successful ad delivery\n• Ads will appear in properly formatted Discord embeds\n• Automation starts immediately after this test",
            inline: false
          },
          {
            name: "💰 Earnings Info",
            value: "Each ad delivered = $0.00001 earned automatically",
            inline: false
          }
        ],
        footer: {
          text: "🚀 DiscordAdNet - Webhook Successfully Activated"
        },
        timestamp: new Date().toISOString()
      }]
    }

    console.log('Testing webhook with strict validation:', webhookUrl.slice(0, 50) + '...')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordAdNet-Bot/1.0'
      },
      body: JSON.stringify(testMessage)
    })

    const responseText = await response.text()
    console.log(`Discord webhook test response: ${response.status} - ${responseText}`)

    if (response.ok) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Webhook test successful! Your webhook is now active and ready to receive ads.',
          status: response.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('Webhook test failed:', response.status, responseText)
      return new Response(
        JSON.stringify({ 
          error: `Webhook test failed: ${response.status} - ${responseText || 'Unknown error'}`,
          success: false,
          details: 'Please check your webhook URL and Discord server permissions'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Webhook test error:', error)
    return new Response(
      JSON.stringify({ 
        error: `Test failed: ${error.message}`,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
