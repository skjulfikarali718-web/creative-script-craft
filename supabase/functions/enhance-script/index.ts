import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, action } = await req.json();

    if (!text || !action) {
      throw new Error('Text and action are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    switch (action) {
      case 'expand':
        systemPrompt = 'You are a script enhancement AI. Expand the given text by adding more details, descriptions, and depth while maintaining the original meaning and tone. Make it approximately 50% longer.';
        break;
      case 'shorten':
        systemPrompt = 'You are a script enhancement AI. Condense the given text to its essential points while maintaining clarity and impact. Make it approximately 50% shorter.';
        break;
      case 'emotional':
        systemPrompt = 'You are a script enhancement AI. Rewrite the given text to be more emotionally engaging and impactful. Add emotional language, vivid descriptions, and compelling storytelling elements.';
        break;
      case 'polish':
        systemPrompt = 'You are a script enhancement AI. Polish the given text by improving grammar, enhancing clarity, refining storytelling tone, and making it more professional and engaging.';
        break;
      case 'regenerate':
        systemPrompt = 'You are a script enhancement AI. Completely rewrite the given text with fresh wording while keeping the same core message and structure. Be creative but maintain the original intent.';
        break;
      default:
        throw new Error('Invalid action');
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
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enhance-script function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
