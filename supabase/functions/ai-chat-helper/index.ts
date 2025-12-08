import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_MESSAGE_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 10000;

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
      
      const identifier = `chat_${clientIp}`;
      
      const { data: limitCheck, error: limitError } = await supabaseAdmin
        .rpc('check_guest_limit', { 
          _identifier: identifier,
          _max_requests: 50 
        });

      if (limitError) {
        console.error("Rate limit check error:", limitError.message);
      } else if (limitCheck && !limitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            message: "Sign in to continue using AI chat",
            remaining: 0
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { message, scriptContext } = await req.json();

    // Validate message input
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate scriptContext if provided
    if (scriptContext !== undefined && scriptContext !== null) {
      if (typeof scriptContext !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Script context must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (scriptContext.length > MAX_CONTEXT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Script context must be less than ${MAX_CONTEXT_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI script writing assistant integrated into ScriptGenie. 
You help users improve their scripts, provide creative suggestions, and answer questions about scriptwriting.
Keep your responses concise, helpful, and actionable. Focus on practical improvements.`;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (scriptContext) {
      messages.push({
        role: 'system',
        content: `Current script context:\n${scriptContext.substring(0, 1000)}`
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
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
    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-chat-helper function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
