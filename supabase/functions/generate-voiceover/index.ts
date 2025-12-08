import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_TEXT_LENGTH = 4000;
const VALID_VOICES = ['male', 'female'];
const VALID_TONES = ['calm', 'energetic', 'dramatic'];

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

    // If no user, enforce rate limiting (more restrictive for voiceover due to cost)
    if (!user) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
      
      const identifier = `voiceover_${clientIp}`;
      
      const { data: limitCheck, error: limitError } = await supabaseAdmin
        .rpc('check_guest_limit', { 
          _identifier: identifier,
          _max_requests: 5 
        });

      if (limitError) {
        console.error("Rate limit check error:", limitError.message);
      } else if (limitCheck && !limitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            message: "Sign in to continue generating voiceovers",
            remaining: 0
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { text, voice, tone } = await req.json();

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
        JSON.stringify({ error: `Text must be less than ${MAX_TEXT_LENGTH} characters. Current length: ${text.length}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate voice if provided
    if (voice !== undefined && voice !== null) {
      if (typeof voice !== 'string' || !VALID_VOICES.includes(voice)) {
        return new Response(
          JSON.stringify({ error: `Invalid voice. Must be one of: ${VALID_VOICES.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate tone if provided
    if (tone !== undefined && tone !== null) {
      if (typeof tone !== 'string' || !VALID_TONES.includes(tone)) {
        return new Response(
          JSON.stringify({ error: `Invalid tone. Must be one of: ${VALID_TONES.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Map voice and tone to OpenAI voices
    // male+calm=onyx, male+energetic=echo, male+dramatic=fable
    // female+calm=nova, female+energetic=shimmer, female+dramatic=alloy
    let selectedVoice = 'alloy';
    if (voice === 'male') {
      if (tone === 'calm') selectedVoice = 'onyx';
      else if (tone === 'energetic') selectedVoice = 'echo';
      else if (tone === 'dramatic') selectedVoice = 'fable';
    } else {
      if (tone === 'calm') selectedVoice = 'nova';
      else if (tone === 'energetic') selectedVoice = 'shimmer';
      else if (tone === 'dramatic') selectedVoice = 'alloy';
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-voiceover function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
