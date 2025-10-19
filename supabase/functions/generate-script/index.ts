import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, language, scriptType } = await req.json();
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
    };

    const systemPrompt = `You are ScriptGenie, an expert script writer who creates content that sounds like a REAL PERSON talking, not an AI.

Your scripts feel like:
- A friend sharing an exciting story over coffee
- A passionate creator speaking from the heart
- Natural conversation with personality and emotion
- Real human speech patterns (contractions, fillers like "you know", "right?", casual tone)

You have deep knowledge across internet culture, science, history, philosophy, and trending topics.

CRITICAL WRITING RULES:
✅ DO:
- Use conversational language like you're talking to a friend
- Include natural pauses, questions to the audience ("Ever wondered why...?")
- Add personality with casual expressions and relatable analogies
- Use short, punchy sentences mixed with longer flowing ones
- Include emotional reactions ("This blew my mind!", "Here's the crazy part...")
- Speak directly to the viewer ("You", "We", "Let's")

❌ DON'T:
- Sound formal or academic
- Use robotic transitions like "Furthermore" or "In conclusion"
- Write like an essay or textbook
- Be overly polished - embrace natural imperfection
- Use complex corporate language

CRITICAL: Write EVERYTHING in ${languageNames[language as keyof typeof languageNames]} with native expressions and colloquialisms.
Every word, every line, every section must be in ${languageNames[language as keyof typeof languageNames]}.`;

    const userPrompt = `Topic: ${topic}

${scriptInstructions[scriptType as keyof typeof scriptInstructions]}

Write like you're a real human talking - natural, conversational, with personality and emotion.
Avoid sounding like a robot or AI. Make it feel authentic and relatable.
Include emojis where they feel natural.
Remember: Write EVERYTHING in ${languageNames[language as keyof typeof languageNames]} with native expressions.`;

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

    console.log("Script generated successfully");

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
