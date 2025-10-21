import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RefreshCw, Wand2, LogOut, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User, Session } from '@supabase/supabase-js';
import { ScriptHistory } from "@/components/ScriptHistory";

type ScriptType = "explainer" | "narrative" | "outline";
type Language = "english" | "bengali" | "hindi";

const Index = () => {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect to auth if user logs out
        if (!session?.user) {
          setTimeout(() => {
            navigate("/auth");
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const generateScript = async (scriptType: ScriptType) => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic or idea first!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOutput("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: {
          topic,
          language,
          scriptType,
        },
      });

      if (error) throw error;

      setOutput(data.script);
      
      // Save script to database
      const { error: saveError } = await supabase.from("scripts").insert({
        user_id: user?.id,
        topic,
        language,
        script_type: scriptType,
        content: data.script,
      });

      if (saveError) {
        console.error("Error saving script:", saveError);
      }

      toast({
        title: "✨ Script Generated!",
        description: "Your influencer script is ready to use.",
      });
    } catch (error: any) {
      console.error("Error generating script:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard.",
    });
  };

  const regenerate = () => {
    setOutput("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1"></div>
            <div className="flex-1 flex justify-end">
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              ScriptGenie
            </h1>
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI Script Writer for Influencers — Generate creative scripts instantly in English, Bengali, or Hindi
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Script
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="glass-card p-6 space-y-6 animate-scale-in">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                Enter your topic or idea
              </label>
              <Textarea
                placeholder="e.g., The secret behind time travel, Karma explained, The mystery of dreams..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[120px] bg-input border-border resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Language</label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="bengali">Bengali (বাংলা)</SelectItem>
                  <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Choose Script Type</label>
              <div className="space-y-2">
                <Button
                  onClick={() => generateScript("explainer")}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 gradient-btn h-auto py-4 px-6"
                >
                  <span className="text-2xl">🎓</span>
                  <div className="text-left">
                    <div className="font-semibold">Explainer Video Script</div>
                    <div className="text-xs opacity-90">Fact-based educational content</div>
                  </div>
                </Button>

                <Button
                  onClick={() => generateScript("narrative")}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 gradient-btn h-auto py-4 px-6"
                >
                  <span className="text-2xl">🎭</span>
                  <div className="text-left">
                    <div className="font-semibold">Narrative Short</div>
                    <div className="text-xs opacity-90">Character-focused storytelling</div>
                  </div>
                </Button>

                <Button
                  onClick={() => generateScript("outline")}
                  disabled={isLoading}
                  className="w-full justify-start gap-3 gradient-btn h-auto py-4 px-6"
                >
                  <span className="text-2xl">🧩</span>
                  <div className="text-left">
                    <div className="font-semibold">Detailed Content Outline</div>
                    <div className="text-xs opacity-90">Structured format for long videos</div>
                  </div>
                </Button>
              </div>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="glass-card p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Script
              </h2>
              {output && (
                <div className="flex gap-2">
                  <Button onClick={copyScript} variant="outline" size="sm" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={regenerate} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-input/50 rounded-lg p-6 border border-border">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground animate-pulse">
                    Creating your viral script...
                  </p>
                </div>
              ) : output ? (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-base leading-loose text-foreground/90 font-sans">
                    {output}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <p>Select a script type to generate your content ✨</p>
                </div>
              )}
            </div>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ScriptHistory />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>✨ Powered by AI • Made for Creators • Ready to Go Viral</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
