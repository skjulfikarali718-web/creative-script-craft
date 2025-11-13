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
    const { scriptContent, emotionMode = 'neutral' } = await req.json();

    if (!scriptContent) {
      throw new Error('Script content is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const emotionGuidelines: Record<string, string> = {
      neutral: "Keep it clear and straightforward.",
      funny: "Make it witty, playful, and engaging with a light touch.",
      emotional: "Use heartfelt, touching language that connects emotionally.",
      serious: "Keep it professional, informative, and impactful.",
      mysterious: "Create intrigue and curiosity with enigmatic phrasing."
    };

    const systemPrompt = `You are an expert social media content strategist. Generate engaging, optimized content for social platforms.
${emotionGuidelines[emotionMode] || emotionGuidelines.neutral}

Return your response as valid JSON with this exact structure:
{
  "title": "SEO-friendly title (under 60 characters)",
  "description": "Short engaging description (40-60 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

Rules:
- Title must be catchy and SEO-optimized
- Description must be concise, engaging, and platform-ready
- Include 5-10 relevant, trending hashtags
- Match the emotion mode: ${emotionMode}
- Focus on maximum engagement`;

    const userPrompt = `Script content:\n\n${scriptContent.substring(0, 1000)}\n\nGenerate an optimized title, description, and hashtags for this content.`;

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
    const contentText = data.choices[0].message.content;
    
    // Parse the JSON response from the AI
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
