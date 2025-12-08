import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TEXT_LENGTH = 10000;
const VALID_ACTIONS = ['expand', 'shorten', 'emotional', 'polish', 'regenerate', 'funny', 'motivational', 'dramatic', 'philosophical', 'professional'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client for rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for authentication
    const authHeader = req.headers.get("Authorization");
    let user = null;

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await supabase.auth.getUser();
      user = userData?.user || null;
    }

    // If no user, enforce rate limiting
    if (!user) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
      
      const identifier = `enhance_${clientIp}`;
      
      const { data: limitCheck, error: limitError } = await supabaseAdmin
        .rpc('check_guest_limit', { 
          _identifier: identifier,
          _max_requests: 20 
        });

      if (limitError) {
        console.error("Rate limit check error:", limitError.message);
      } else if (limitCheck && !limitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            message: "Sign in to continue enhancing scripts",
            remaining: 0
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { text, action } = await req.json();

    // Validate text input
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Validate action input
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
        systemPrompt = 'You are a script enhancement AI. Rewrite the given text to be more emotionally engaging and impactful. Add emotional language, vivid descriptions, and compelling storytelling elements. Make it sentimental and heart-touching.';
        break;
      case 'polish':
        systemPrompt = 'You are a script enhancement AI. Polish the given text by improving grammar, enhancing clarity, refining storytelling tone, and making it more professional and engaging.';
        break;
      case 'regenerate':
        systemPrompt = 'You are a script enhancement AI. Completely rewrite the given text with fresh wording while keeping the same core message and structure. Be creative but maintain the original intent.';
        break;
      case 'funny':
        systemPrompt = 'You are a script tone adjustment AI. Transform the given text into a funny, witty, and relatable version. Add humor, clever wordplay, and light-hearted elements while maintaining the core message. Use casual, conversational language that makes people smile.';
        break;
      case 'motivational':
        systemPrompt = 'You are a script tone adjustment AI. Transform the given text into an uplifting, inspiring, and motivational version. Use powerful, encouraging language that energizes and drives action. Focus on possibilities, growth, and empowerment.';
        break;
      case 'dramatic':
        systemPrompt = 'You are a script tone adjustment AI. Transform the given text into a dramatic, cinematic version with emotional tension and powerful pacing. Build intensity, use vivid imagery, and create compelling narrative momentum. Make it feel like a movie scene.';
        break;
      case 'philosophical':
        systemPrompt = 'You are a script tone adjustment AI. Transform the given text into a deep, reflective, and philosophical version. Explore underlying meanings, raise thoughtful questions, and add contemplative insights. Use introspective and thought-provoking language.';
        break;
      case 'professional':
        systemPrompt = 'You are a script tone adjustment AI. Transform the given text into a formal, structured, and professional version. Use clear, authoritative language with proper business terminology. Maintain objectivity and precision while being engaging.';
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
