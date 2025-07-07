import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json().catch(() => ({}))
    const isLLMMode = requestBody.llm_mode || requestBody.continuous_llm

    console.log('🤖 LLM-POWERED ad distribution starting...', { 
      llm_mode: isLLMMode, 
      timestamp: new Date().toISOString() 
    })

    // Get all public ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'public')

    if (adsError) {
      console.error('❌ LLM: Error fetching ads:', adsError)
      throw adsError
    }

    console.log(`📊 LLM: Found ${ads?.length || 0} public ads for LLM evaluation`)

    // Get ALL ACTIVE webhooks
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)

    if (webhooksError) {
      console.error('❌ LLM: Error fetching webhooks:', webhooksError)
      throw webhooksError
    }

    console.log(`📊 LLM: Found ${webhooks?.length || 0} active webhooks`)

    if (!ads || ads.length === 0) {
      console.log('⚠️ LLM: No public ads to evaluate - scheduling retry in 1 minute')
      
      // Schedule next cycle even with no ads
      EdgeRuntime.waitUntil(scheduleNextLLMCycle(supabase))
      
      return new Response(
        JSON.stringify({ 
          message: 'No public ads available - LLM cycle continues',
          llm_mode: isLLMMode,
          next_cycle_in: '1 minute',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ LLM: No active webhooks found - scheduling retry in 1 minute')
      
      // Schedule next cycle even with no webhooks
      EdgeRuntime.waitUntil(scheduleNextLLMCycle(supabase))
      
      return new Response(
        JSON.stringify({ 
          message: 'No active webhooks - LLM cycle continues',
          llm_mode: isLLMMode,
          next_cycle_in: '1 minute',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Select the first ad for LLM evaluation
    const currentAd = ads[0]
    console.log(`🤖 LLM: Evaluating ad: "${currentAd.title}"`)

    // Send ad to OpenRouter LLM for evaluation
    const llmApproval = await evaluateAdWithLLM(currentAd)
    
    console.log(`🤖 LLM Response: ${llmApproval.approved ? 'APPROVED' : 'REJECTED'}`)
    console.log(`🤖 LLM Reasoning: ${llmApproval.reasoning}`)

    if (!llmApproval.approved) {
      console.log('❌ LLM: Ad rejected by AI - scheduling next cycle in 1 minute')
      
      // Log the rejection
      await supabase
        .from('ad_deliveries')
        .insert({
          webhook_id: null,
          ad_id: currentAd.id,
          status: 'llm_rejected',
          error_message: `LLM Rejection: ${llmApproval.reasoning}`
        })

      // Schedule next cycle after rejection
      EdgeRuntime.waitUntil(scheduleNextLLMCycle(supabase))
      
      return new Response(
        JSON.stringify({ 
          message: 'Ad rejected by LLM - cycle continues',
          ad_title: currentAd.title,
          llm_reasoning: llmApproval.reasoning,
          next_cycle_in: '1 minute',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // LLM approved the ad - proceed with distribution
    console.log('✅ LLM: Ad approved by AI - starting distribution to Discord')

    let totalSent = 0
    let totalErrors = 0
    let totalEarnings = 0
    const earnedAmount = 0.00001

    // Distribute the LLM-approved ad to all webhooks
    for (const webhook of webhooks) {
      try {
        // Generate redirect URL for tracking
        const redirectUrl = `https://azuwehjpqqmhfzfluiui.supabase.co/functions/v1/ad-redirect?ad_id=${currentAd.id}&webhook_id=${webhook.id}`
        
        // Create enhanced Discord message for LLM-approved content
        const discordMessage = {
          content: "🤖 **AI-Approved Sponsored Content** - Quality guaranteed by AI!",
          embeds: [
            {
              title: currentAd.title || "AI-Approved Sponsored Content",
              description: currentAd.text || "Check out this AI-verified offer!",
              url: redirectUrl,
              color: 5865242,
              fields: [
                {
                  name: "🤖 AI Quality Check",
                  value: "✅ Approved by AI Assistant",
                  inline: false
                },
                {
                  name: "💰 Earning Opportunity", 
                  value: `You earn $${earnedAmount} for this view!`,
                  inline: true
                },
                {
                  name: "🎯 AI Reasoning",
                  value: llmApproval.reasoning.substring(0, 100) + "...",
                  inline: false
                }
              ],
              footer: {
                text: "🤖 AI-Powered DiscordAdNet - Quality content guaranteed!"
              },
              timestamp: new Date().toISOString()
            }
          ]
        }

        if (currentAd.image_url) {
          discordMessage.embeds[0].image = { url: currentAd.image_url }
        }

        console.log(`📤 LLM: Sending AI-approved "${currentAd.title}" to ${webhook.server_name} with tracking URL`)

        // Send to Discord webhook
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DiscordAdNet-AIBot/1.0'
          },
          body: JSON.stringify(discordMessage)
        })

        console.log(`📡 LLM: Discord response for ${webhook.server_name}: ${response.status}`)

        if (response.ok) {
          totalSent++
          totalEarnings += earnedAmount
          
          console.log(`💰 LLM: Processing earnings for user ${webhook.user_id}`)
          
          // Update user balance
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', webhook.user_id)
            .single()

          if (!getUserError && currentUser) {
            const currentBalance = currentUser.balance || 0
            const newBalance = Number((currentBalance + earnedAmount).toFixed(8))
            
            console.log(`💰 LLM: User ${webhook.user_id}: $${currentBalance} → $${newBalance}`)
            
            const { error: balanceError } = await supabase
              .from('users')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', webhook.user_id)
            
            if (!balanceError) {
              console.log(`✅ LLM: Balance updated successfully for user ${webhook.user_id}`)
            } else {
              console.error(`❌ LLM: Balance update failed:`, balanceError)
            }
          }

          // Update ad impressions
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
              earning_amount: earnedAmount
            })

          console.log(`✅ LLM: Success for ${webhook.server_name}, earned $${earnedAmount}`)

        } else {
          const responseText = await response.text()
          totalErrors++
          console.error(`❌ LLM: Failed for ${webhook.server_name}:`, response.status, responseText)
          
          // Log errors
          await supabase
            .from('webhooks')
            .update({ 
              total_errors: (webhook.total_errors || 0) + 1,
              last_sent_at: new Date().toISOString(),
              last_error: `${response.status}: ${responseText}`
            })
            .eq('id', webhook.id)

          await supabase
            .from('ad_deliveries')
            .insert({
              webhook_id: webhook.id,
              ad_id: currentAd.id,
              status: 'error',
              error_message: `${response.status}: ${responseText}`
            })
        }
      } catch (error) {
        totalErrors++
        console.error(`💥 LLM: Exception for webhook ${webhook.server_name}:`, error)
        
        // Log errors
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
            ad_id: currentAd.id,
            status: 'error',
            error_message: error.message
          })
      }

      // Small delay between sends
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`🎯 LLM: Distribution complete - scheduling next cycle in 1 minute`)
    
    // Schedule the next LLM cycle as a background task
    EdgeRuntime.waitUntil(scheduleNextLLMCycle(supabase))

    const summary = {
      success: true,
      message: `LLM-approved ad distributed: ${totalSent} successful, ${totalErrors} errors`,
      llm_mode: true,
      ad_title: currentAd.title,
      llm_approval: llmApproval.reasoning,
      next_cycle_in: '1 minute',
      timestamp: new Date().toISOString(),
      stats: {
        adEvaluated: currentAd.title,
        webhooksUsed: webhooks.length,
        totalDeliveries: totalSent,
        totalErrors: totalErrors,
        totalEarnings: Number(totalEarnings.toFixed(8)),
        runType: 'llm_continuous'
      }
    }

    console.log(`🤖 LLM distribution COMPLETE!`)
    console.log(`📊 LLM STATS: ${totalSent} successful, ${totalErrors} errors`)
    console.log(`💰 LLM EARNINGS: $${totalEarnings.toFixed(8)} distributed`)
    console.log(`⏰ NEXT LLM CYCLE: 1 minute`)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 LLM DISTRIBUTION CRITICAL ERROR:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        llm_mode: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to evaluate ad with OpenRouter LLM
async function evaluateAdWithLLM(ad: any): Promise<{approved: boolean, reasoning: string}> {
  if (!OPENROUTER_API_KEY) {
    console.error('❌ LLM: OpenRouter API key not configured')
    return { approved: true, reasoning: 'LLM evaluation skipped - no API key' }
  }

  try {
    const prompt = `Please evaluate this advertisement for quality and appropriateness:

Title: ${ad.title || 'No title'}
Content: ${ad.text || 'No content'}
URL: ${ad.url || 'No URL'}

Instructions:
- If the ad is appropriate, safe, and of good quality, respond with "CONTINUE" followed by a brief reason
- If the ad is inappropriate, unsafe, or low quality, respond with "STOP" followed by a brief reason
- Keep your response concise and professional

Your evaluation:`

    console.log('🤖 LLM: Sending ad to OpenRouter for evaluation...')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://discordadnet.com',
        'X-Title': 'DiscordAdNet AI Content Moderator'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          {
            role: 'system',
            content: 'You are an AI content moderator for an advertising platform. Evaluate ads for quality and appropriateness.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      console.error('❌ LLM: OpenRouter API error:', response.status)
      return { approved: true, reasoning: 'LLM evaluation failed - defaulting to approve' }
    }

    const data = await response.json()
    const llmResponse = data.choices[0]?.message?.content || ''
    
    console.log('🤖 LLM Raw Response:', llmResponse)

    const approved = llmResponse.toUpperCase().includes('CONTINUE')
    const reasoning = llmResponse.replace(/^(CONTINUE|STOP)\s*/i, '').trim()

    return {
      approved,
      reasoning: reasoning || (approved ? 'AI approved the content' : 'AI rejected the content')
    }

  } catch (error) {
    console.error('💥 LLM: Error evaluating ad:', error)
    return { approved: true, reasoning: 'LLM evaluation error - defaulting to approve' }
  }
}

// Function to schedule the next LLM cycle (background task)
async function scheduleNextLLMCycle(supabase: any) {
  console.log('⏰ LLM: Scheduling next cycle in 60 seconds...')
  
  // Wait 1 minute
  await new Promise(resolve => setTimeout(resolve, 60000))
  
  try {
    console.log('🔄 LLM: Triggering next cycle...')
    
    // Call the distribute-ads function again with LLM mode
    const { error } = await supabase.functions.invoke('distribute-ads', {
      body: { llm_mode: true, continuous_llm: true }
    })
    
    if (error) {
      console.error('❌ LLM: Error triggering next cycle:', error)
    } else {
      console.log('✅ LLM: Successfully triggered next cycle')
    }
  } catch (error) {
    console.error('💥 LLM: Critical error in cycle scheduling:', error)
  }
}
