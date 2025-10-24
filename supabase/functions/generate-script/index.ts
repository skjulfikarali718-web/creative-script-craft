import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { topic, language, scriptType } = await req.json();
    
    // Validate inputs
    if (!topic || typeof topic !== 'string' || topic.trim().length < 5 || topic.length > 500) {
      return new Response(
        JSON.stringify({ error: "Invalid topic: must be 5-500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!['english', 'bengali', 'hindi'].includes(language)) {
      return new Response(
        JSON.stringify({ error: "Invalid language: must be english, bengali, or hindi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!['explainer', 'narrative', 'outline', 'youtube', 'reels', 'movie', 'podcast', 'ad', 'blog'].includes(scriptType)) {
      return new Response(
        JSON.stringify({ error: "Invalid script type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Language names for prompts
    const languageNames = {
      english: "English",
      bengali: "Bengali (বাংলা)",
      hindi: "Hindi (हिंदी)",
    };

    // Script type instructions
    const scriptInstructions = {
      explainer: `Generate an EXPLAINER VIDEO SCRIPT with:
- A catchy title
- An engaging hook (1-2 lines)
- 3-5 clear explanation sections with facts and examples
- Educational tone with storytelling elements
- A strong outro with call-to-action`,
      
      narrative: `Generate a NARRATIVE SHORT SCRIPT with:
- A compelling title
- Setting (time and place)
- Character introduction
- Scene-by-scene narration with dialogues
- An emotional twist or conflict
- A memorable closing line or moral`,
      
      outline: `Generate a DETAILED CONTENT OUTLINE with:
- A descriptive title
- Introduction section
- 4-6 main sections with subtopics and key talking points
- Suggested visuals or tone for each section
- Transition suggestions between sections
- Summary and outro`,

      youtube: `Generate a YOUTUBE VIDEO SCRIPT with:
- An attention-grabbing title and thumbnail idea
- A strong hook in the first 10 seconds
- Clear sections with timestamps
- Engaging storytelling and examples
- Call-to-action and outro`,

      reels: `Generate a SHORT-FORM REELS/SHORTS SCRIPT with:
- Instant hook (first 3 seconds)
- Quick, punchy content (30-60 seconds)
- Visual suggestions for each scene
- Trending audio or effect suggestions
- Strong ending with CTA`,

      movie: `Generate a MOVIE SCENE SCRIPT with:
- Scene setting and atmosphere
- Character descriptions and motivations
- Detailed dialogue exchanges
- Action and emotion beats
- Cinematic directions`,

      podcast: `Generate a PODCAST EPISODE SCRIPT with:
- Episode title and intro music cue
- Host introduction and topic overview
- Main discussion points with transitions
- Guest questions (if applicable)
- Outro with subscribe CTA`,

      ad: `Generate an ADVERTISEMENT SCRIPT with:
- Product/service introduction
- Problem-solution framework
- Key benefits and features
- Emotional appeal
- Strong call-to-action`,

      blog: `Generate a BLOG POST OUTLINE with:
- SEO-friendly title
- Introduction with hook
- Main sections with subheadings
- Key points and examples
- Conclusion with takeaways`,
    };

    const systemPrompt = `You are ScriptGenie, an expert AI script writer for influencers, YouTubers, and content creators. 
You have deep knowledge across internet culture, science, history, philosophy, and trending topics.
You write engaging, well-structured scripts that are:
- Clear and easy to follow
- Emotionally compelling and trend-aware
- Perfect for social media and video content
- Authentic and relatable

CRITICAL: You MUST write the entire script in ${languageNames[language as keyof typeof languageNames]}. 
Every word, every line, every section must be in ${languageNames[language as keyof typeof languageNames]}.
Do not mix languages. Use native script and vocabulary.`;

    const userPrompt = `Topic: ${topic}

${scriptInstructions[scriptType as keyof typeof scriptInstructions]}

Make it creative, engaging, and ready to use. Include emojis where appropriate.
Remember: Write EVERYTHING in ${languageNames[language as keyof typeof languageNames]}.`;

    console.log("Generating script for:", { topic, language, scriptType });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    console.log("Script generated successfully for user:", user.id);

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-script function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
