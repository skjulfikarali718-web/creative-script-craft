import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TEXT_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 5000;
const MAX_TOPIC_LENGTH = 500;
const MAX_CONTENT_LENGTH = 10000;
const VALID_ACTIONS = ['fact-check', 'expand-fact', 'smooth-integrate', 'suggest-related', 'generate_sources'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, action, context, topic, content, scriptType } = await req.json();
    console.log('Research assistant request:', { action, hasText: !!text, hasTopic: !!topic, scriptType });

    // Validate action
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof action !== 'string' || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate text if provided
    if (text !== undefined && text !== null) {
      if (typeof text !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Text must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (text.length > MAX_TEXT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Text must be less than ${MAX_TEXT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate context if provided
    if (context !== undefined && context !== null) {
      if (typeof context === 'object') {
        const contextStr = JSON.stringify(context);
        if (contextStr.length > MAX_CONTEXT_LENGTH) {
          return new Response(
            JSON.stringify({ error: `Context must be less than ${MAX_CONTEXT_LENGTH} characters` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (typeof context === 'string' && context.length > MAX_CONTEXT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Context must be less than ${MAX_CONTEXT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate topic if provided
    if (topic !== undefined && topic !== null) {
      if (typeof topic !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Topic must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (topic.length > MAX_TOPIC_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Topic must be less than ${MAX_TOPIC_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate content if provided
    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Content must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Content must be less than ${MAX_CONTENT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'fact-check':
        systemPrompt = `You are a fact-checking assistant. Verify the provided text and return accurate, verified information with credible sources. Format your response as JSON with:
{
  "verified": true/false,
  "summary": "Brief verified fact summary",
  "sources": ["Source 1", "Source 2", "Source 3"],
  "confidence": "high/medium/low"
}`;
        userPrompt = `Fact-check this text: "${text}"`;
        break;

      case 'expand-fact':
        systemPrompt = `You are a research assistant. Provide a concise, one-sentence explanation or interesting fact about the given keyword. Make it educational and engaging.`;
        userPrompt = `Provide a brief, interesting fact about: "${text}"`;
        break;

      case 'smooth-integrate':
        systemPrompt = `You are a script editor specializing in natural fact integration. Rewrite the provided text to smoothly incorporate the verified fact while maintaining storytelling flow and tone. Keep it natural and engaging.`;
        userPrompt = `Original text: "${text}"\n\nVerified fact to integrate: "${context?.fact || ''}"\n\nRewrite this to naturally incorporate the fact while maintaining narrative flow.`;
        break;

      case 'suggest-related':
        systemPrompt = `You are a research assistant. Suggest one interesting, related fact or detail connected to the given topic. Keep it concise and relevant.`;
        userPrompt = `Suggest an interesting related fact about: "${text}"`;
        break;

      case 'generate_sources':
        systemPrompt = `You are a research assistant. Generate 3-5 credible source references based on the script content. Return as JSON array: 
[{"title": "Source Name", "description": "Brief description of what this source covers", "url": "optional URL if available"}]`;
        userPrompt = `Generate source references for this ${scriptType} script about "${topic}". Content excerpt: "${content}"`;
        break;

      default:
        throw new Error('Invalid action type');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    console.log('Research assistant completed successfully');

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in research-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
