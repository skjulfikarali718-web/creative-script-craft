import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RefreshCw, Wand2, LogOut, Save, Edit, BookOpen, LayoutDashboard, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User, Session } from '@supabase/supabase-js';
import { ScriptHistory } from "@/components/ScriptHistory";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScriptEditor } from "@/components/ScriptEditor";
import { SavedScriptsPanel } from "@/components/SavedScriptsPanel";
import { z } from "zod";

type ScriptType = "youtube" | "reels" | "movie" | "podcast" | "ad" | "blog";
type Language = "english" | "bengali" | "hindi";
type Tone = "funny" | "emotional" | "professional" | "casual" | "dramatic";

const scriptInputSchema = z.object({
  topic: z.string()
    .trim()
    .min(10, "Topic must be at least 10 characters")
    .max(300, "Topic must be less than 300 characters")
    .refine((val) => val.split(/\s+/).filter(w => w.length > 0).length >= 3, {
      message: "Topic must contain at least 3 meaningful words"
    })
    .refine((val) => !val.toLowerCase().startsWith("generate"), {
      message: "Please describe your topic directly (e.g., 'AI trends in 2025' instead of 'generate a video about AI')"
    }),
  language: z.enum(["english", "bengali", "hindi"]),
  scriptType: z.enum(["youtube", "reels", "movie", "podcast", "ad", "blog"])
});

const Index = () => {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [scriptType, setScriptType] = useState<ScriptType>("youtube");
  const [tone, setTone] = useState<Tone>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);
  const [generationCount, setGenerationCount] = useState(0);
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

  const generateScript = async () => {
    if (generationCount >= 9) {
      toast({
        title: "Daily Limit Reached",
        description: "You've used all 9 free generations. Upgrade to Pro for unlimited access!",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    const validation = scriptInputSchema.safeParse({ topic, language, scriptType });
    
    if (!validation.success) {
      toast({
        title: "Invalid Input",
        description: validation.error.errors[0].message,
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
          tone,
        },
      });

      if (error) throw error;

      // Show script immediately
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

      setGenerationCount(prev => prev + 1);

      toast({
        title: "✨ Script Generated!",
        description: "Your creative script is ready!",
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
    <div className="min-h-screen relative">
      <ParticlesBackground />
      <OnboardingModal />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-background/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Creative Script Craft
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm">
                <a href="#generate" className="text-foreground hover:text-primary transition-colors">Generate</a>
                <a href="#saved" className="text-foreground hover:text-primary transition-colors">Saved</a>
                <a href="#dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
              </div>
              
              <ThemeToggle />
              
              {user && (
                <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 hover-lift">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12 animate-fade-up">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
            <h1 className="relative text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-glow-pulse">
              Creative Script Craft
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in">
            Advanced AI Writing Platform — Transform your ideas into viral scripts with cinematic precision
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/30">
              <span className="text-sm font-medium">✨ {9 - generationCount} Free Generations Left</span>
            </div>
            <Button className="gap-2 gradient-btn hover-scale">
              <Crown className="w-4 h-4" />
              Go Pro
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="generate" className="space-y-8" id="generate">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Save className="w-4 h-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <Card className="glass-card p-8 space-y-6 animate-slide-in-left">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    What do you want to create?
                  </label>
                  <Textarea
                    placeholder="e.g., A YouTube video about AI trends, A motivational Instagram Reel, A podcast intro about mental health..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[140px] bg-input/50 border-border resize-none focus:ring-2 focus:ring-primary/50 transition-all text-base"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Script Type</label>
                    <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                      <SelectTrigger className="bg-input/50 border-border focus:ring-2 focus:ring-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">📺 YouTube Video</SelectItem>
                        <SelectItem value="reels">📱 Instagram Reels</SelectItem>
                        <SelectItem value="movie">🎬 Short Film</SelectItem>
                        <SelectItem value="podcast">🎙️ Podcast</SelectItem>
                        <SelectItem value="ad">📢 Advertisement</SelectItem>
                        <SelectItem value="blog">✍️ Blog Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Tone/Style</label>
                    <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                      <SelectTrigger className="bg-input/50 border-border focus:ring-2 focus:ring-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funny">😄 Funny</SelectItem>
                        <SelectItem value="emotional">💙 Emotional</SelectItem>
                        <SelectItem value="professional">💼 Professional</SelectItem>
                        <SelectItem value="casual">😎 Casual</SelectItem>
                        <SelectItem value="dramatic">🎭 Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Language</label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger className="bg-input/50 border-border focus:ring-2 focus:ring-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">🇬🇧 English</SelectItem>
                      <SelectItem value="bengali">🇧🇩 Bengali (বাংলা)</SelectItem>
                      <SelectItem value="hindi">🇮🇳 Hindi (हिंदी)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateScript}
                  disabled={isLoading || !topic.trim()}
                  className="w-full h-14 text-lg gradient-btn gap-3 hover-scale"
                >
                  <Sparkles className="w-5 h-5" />
                  {isLoading ? "Generating..." : "Generate Script"}
                </Button>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Tip: Be specific about your topic for better results
                  </p>
                </div>
              </Card>

              {/* Output Section */}
              <Card className="glass-card p-8 space-y-6 animate-slide-in-right">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary animate-glow-pulse" />
                    Generated Script
                  </h2>
                  {output && (
                    <div className="flex gap-2 animate-fade-in">
                      <Button onClick={copyScript} variant="outline" size="sm" className="gap-2 hover-lift">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setShowEditor(true)} variant="outline" size="sm" className="gap-2 hover-lift">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={regenerate} variant="outline" size="sm" className="gap-2 hover-lift">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="min-h-[500px] max-h-[700px] overflow-y-auto bg-input/30 rounded-xl p-8 border border-border/50">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-lg font-medium animate-pulse">AI is thinking...</p>
                        <p className="text-sm text-muted-foreground">Crafting your perfect script</p>
                      </div>
                    </div>
                  ) : output ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                        {output}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wand2 className="w-10 h-10 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Ready to create magic?</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Fill in the details and click Generate to create your script
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="saved" id="saved">
            <Card className="glass-card p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Saved Scripts</h2>
                <p className="text-muted-foreground">Access and manage all your generated scripts</p>
              </div>
              <SavedScriptsPanel
                onView={(script) => {
                  setOutput(script.content);
                }}
                onEdit={(script) => {
                  setEditingScript(script);
                  setShowEditor(true);
                }}
              />
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="glass-card p-8 text-center space-y-4">
              <h2 className="text-3xl font-bold">Script Templates</h2>
              <p className="text-muted-foreground">Coming soon! Pre-made templates for different content types</p>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" id="dashboard">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Scripts This Week</h3>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-4xl font-bold">{generationCount}</p>
                <p className="text-sm text-muted-foreground">Keep creating!</p>
              </Card>

              <Card className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Free Generations</h3>
                  <Crown className="w-5 h-5 text-accent" />
                </div>
                <p className="text-4xl font-bold">{9 - generationCount}/9</p>
                <Button variant="outline" size="sm" className="w-full gradient-btn">
                  Upgrade to Pro
                </Button>
              </Card>

              <Card className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Top Category</h3>
                  <BookOpen className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-4xl font-bold">{scriptType}</p>
                <p className="text-sm text-muted-foreground">Most used type</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center py-8 space-y-4 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ by Sk Julfikar Ali • Powered by Advanced AI
          </p>
        </footer>
      </div>

      {/* Script Editor Modal */}
      {showEditor && (
        <ScriptEditor
          initialContent={editingScript?.content || output}
          onClose={() => {
            setShowEditor(false);
            setEditingScript(null);
          }}
          onSave={(content) => {
            setOutput(content);
            setShowEditor(false);
            setEditingScript(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
