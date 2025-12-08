import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { WelcomeModal } from "@/components/WelcomeModal";
import { GuestLimitModal } from "@/components/GuestLimitModal";
import { GuestModeBanner } from "@/components/GuestModeBanner";
import { SignOutConfirmDialog } from "@/components/SignOutConfirmDialog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { TopicAnalyzer } from "@/components/TopicAnalyzer";
import { AIChatHelper } from "@/components/AIChatHelper";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SyncStatus } from "@/components/SyncStatus";
import { SmartSummary } from "@/components/SmartSummary";
import { ScriptFormatter } from "@/components/ScriptFormatter";
import { SourcesPanel } from "@/components/SourcesPanel";
import { Sparkles, Copy, Download, Save, BookOpen, Zap, Film, Podcast, Youtube, Instagram, Github, Twitter, BarChart, LogOut, UserCog } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const scriptInputSchema = z.object({
  topic: z.string()
    .trim()
    .min(5, "Topic must be at least 5 characters")
    .max(500, "Topic must be less than 500 characters")
    .regex(/^[a-zA-Z0-9\s\p{L},.!?'-]+$/u, "Topic contains invalid characters"),
  language: z.enum(["english", "bengali", "hindi"]),
  scriptType: z.enum(["youtube", "reels", "movie", "podcast", "ad", "blog"]),
  emotionMode: z.enum(["neutral", "funny", "emotional", "serious", "mysterious"]).optional()
});

type ScriptInput = z.infer<typeof scriptInputSchema>;

const Index = () => {
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [remainingGenerations, setRemainingGenerations] = useState(9);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const [hasUsedGuestGeneration, setHasUsedGuestGeneration] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [selectedEmotionMode, setSelectedEmotionMode] = useState("neutral");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<ScriptInput>({
    resolver: zodResolver(scriptInputSchema),
    defaultValues: {
      topic: "",
      language: "english",
      scriptType: "youtube",
      emotionMode: "neutral",
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // Check if user is new visitor (not returning)
      const hasVisited = localStorage.getItem("scriptgenie_visited");
      const guestUsed = localStorage.getItem("scriptgenie_guest_used");
      
      if (!user && !hasVisited) {
        setShowWelcomeModal(true);
        localStorage.setItem("scriptgenie_visited", "true");
      }
      
      if (!user && guestUsed === "true") {
        setHasUsedGuestGeneration(true);
      }
    });

    // Check if we're coming from edit mode
    if (location.state?.editScript) {
      const editScript = location.state.editScript;
      setGeneratedScript(editScript.content);
      form.setValue("topic", editScript.topic);
      form.setValue("scriptType", editScript.script_type);
      form.setValue("language", editScript.language);
      
      // Clear the state
      window.history.replaceState({}, document.title);
      
      // Scroll to generator
      setTimeout(() => {
        document.getElementById("generator")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location]);

  const handleGuestMode = () => {
    setShowWelcomeModal(false);
    toast({
      title: "Guest Mode Activated! 🎉",
      description: "Try ScriptGenie with 1 free generation. Sign in for unlimited access!",
    });
  };

  const onSubmit = async (data: ScriptInput) => {
    // Guest user check
    if (!user && hasUsedGuestGeneration) {
      setShowGuestLimitModal(true);
      return;
    }

    // Authenticated user generation limit
    if (user && remainingGenerations <= 0) {
      toast({
        title: "Generation Limit Reached",
        description: "You've used all your free generations. Upgrade to Premium!",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedScript("");
    setSelectedEmotionMode(data.emotionMode || 'neutral');

    try {
      const { data: scriptData, error } = await supabase.functions.invoke("generate-script", {
        body: {
          topic: data.topic,
          language: data.language,
          scriptType: data.scriptType,
          emotionMode: data.emotionMode,
        },
      });

      if (error) throw error;

      setGeneratedScript(scriptData.script);
      
      // Handle guest vs authenticated user
      if (!user) {
        setHasUsedGuestGeneration(true);
        localStorage.setItem("scriptgenie_guest_used", "true");
        
        // Show guest limit modal after a short delay
        setTimeout(() => {
          setShowGuestLimitModal(true);
        }, 2000);
        
        toast({
          title: "Script Generated! ✨",
          description: "Sign in to generate unlimited scripts!",
        });
      } else {
        setRemainingGenerations((prev) => Math.max(0, prev - 1));
        
        toast({
          title: "Script Generated! ✨",
          description: "Your AI-powered script is ready",
        });
      }
    } catch (error: any) {
      console.error("Script generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({ title: "Copied! 📋", description: "Script copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${Date.now()}.txt`;
    a.click();
    toast({ title: "Downloaded! 💾", description: "Script saved to your device" });
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("saved_scripts").insert({
        user_id: user.id,
        title: form.getValues("topic").slice(0, 100),
        content: generatedScript,
        script_type: form.getValues("scriptType"),
        language: form.getValues("language"),
      });

      if (error) throw error;

      toast({ title: "Saved! ✅", description: "Script saved successfully" });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const scrollToGenerator = () => {
    document.getElementById("generator")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setGeneratedScript("");
      setHasUsedGuestGeneration(false);
      setShowSignOutDialog(false);
      
      toast({
        title: "✅ Signed Out Successfully",
        description: "You've been logged out. Come back anytime!",
      });
      
      // Force reload to clear any cached state
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("scriptgenie_guest_used");
      localStorage.removeItem("scriptgenie_visited");
      toast({
        title: "Switching Account",
        description: "Redirecting to sign in...",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Switch account error:", error);
      toast({
        title: "Error",
        description: "Failed to switch account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground />
      <WelcomeModal open={showWelcomeModal} onGuestMode={handleGuestMode} />
      <GuestLimitModal open={showGuestLimitModal} onClose={() => setShowGuestLimitModal(false)} />
      <SignOutConfirmDialog 
        open={showSignOutDialog} 
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutDialog(false)}
      />
      
      {/* Guest Mode Banner */}
      {!user && (
        <GuestModeBanner />
      )}
      
      {/* Navbar */}
      <nav className="glass-card fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ScriptGenie
              </span>
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <span className="hidden sm:inline">Creative Script Craft</span>
                <span className="sm:hidden">ScriptGenie</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              <button onClick={scrollToGenerator} className="text-foreground/80 hover:text-primary transition-colors text-sm">
                Generate
              </button>
              <button onClick={() => navigate("/saved")} className="text-foreground/80 hover:text-primary transition-colors text-sm">
                Saved
              </button>
              <button onClick={() => navigate("/analytics")} className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 text-sm">
                <BarChart className="h-4 w-4" />
                Analytics
              </button>
              <a 
                href="https://www.instagram.com/rajali10024/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-pink-500 transition-colors"
                aria-label="Follow on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <ThemeSwitcher />
              <SyncStatus />
              <Button variant="outline" size="sm" className="border-secondary/50 text-secondary hover:bg-secondary/10 text-xs">
                Premium 💎
              </Button>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <UserCog className="h-4 w-4" />
                      <span className="hidden sm:inline">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleSwitchAccount} className="cursor-pointer">
                      <UserCog className="h-4 w-4 mr-2" />
                      Switch Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowSignOutDialog(true)} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="default" size="sm" className="gradient-btn text-xs sm:text-sm">
                  {hasUsedGuestGeneration ? "Sign In" : "Sign In"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 ${!user ? 'pt-36 sm:pt-32' : ''}`}>
        <div className="container mx-auto text-center max-w-4xl">
          <div className="animate-fade-in">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Where Creativity Meets Code
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Write <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Viral Scripts
              </span> in Seconds
            </h1>
            <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              Your AI co-writer for YouTube, Films, and Storytelling. Generate professional scripts with smart tone options and creative polish.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={scrollToGenerator} size="lg" className="gradient-btn text-lg px-8 py-6">
                Start Writing <Zap className="ml-2 h-5 w-5" />
              </Button>
              <Button onClick={() => navigate("/saved")} variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/30 hover:border-primary/50">
                <BookOpen className="mr-2 h-5 w-5" /> View Saved
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Youtube, title: "YouTube Scripts", desc: "Engaging video scripts optimized for views" },
              { icon: Film, title: "Film & Stories", desc: "Cinematic narratives with emotional depth" },
              { icon: Podcast, title: "Podcast Scripts", desc: "Conversational content that captivates" },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 hover-lift group">
                <feature.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-foreground/70">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Topic Analyzer */}
          <TopicAnalyzer onUseIdea={(idea) => form.setValue('topic', idea)} />

          <div className="glass-card p-8 md:p-12 animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">AI Script Generator</h2>
              {user ? (
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 animate-glow-pulse">
                  {remainingGenerations} Free Generations Left
                </span>
              ) : (
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  hasUsedGuestGeneration 
                    ? 'bg-destructive/10 text-destructive border-destructive/20' 
                    : 'bg-primary/10 text-primary border-primary/20 animate-glow-pulse'
                }`}>
                  {hasUsedGuestGeneration ? 'Guest Limit Reached' : '1 Free Guest Try'}
                </span>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="scriptType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Script Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass-card border-primary/20 focus:border-primary/50 h-12">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card border-primary/20">
                          <SelectItem value="youtube">YouTube Video</SelectItem>
                          <SelectItem value="reels">Instagram Reels</SelectItem>
                          <SelectItem value="movie">Short Film</SelectItem>
                          <SelectItem value="podcast">Podcast Episode</SelectItem>
                          <SelectItem value="ad">Ad Copy</SelectItem>
                          <SelectItem value="blog">Blog Script</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-card border-primary/20 focus:border-primary/50 h-12">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-card border-primary/20">
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="bengali">Bengali</SelectItem>
                            <SelectItem value="hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emotionMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Emotion Mode 🎭</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-card border-primary/20 focus:border-primary/50 h-12">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-card border-primary/20">
                            <SelectItem value="neutral">🎙️ Neutral</SelectItem>
                            <SelectItem value="funny">😄 Funny</SelectItem>
                            <SelectItem value="emotional">💖 Emotional</SelectItem>
                            <SelectItem value="serious">🧠 Serious</SelectItem>
                            <SelectItem value="mysterious">🕵️ Mysterious</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Your Topic or Idea</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., AI trends in 2025, inspiring life story, tech product review..."
                          className="glass-card border-primary/20 focus:border-primary/50 min-h-[120px] resize-none focus:shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isGenerating || (!user && hasUsedGuestGeneration)}
                  className="gradient-btn w-full h-14 text-lg font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      AI is writing your script...
                    </>
                  ) : (!user && hasUsedGuestGeneration) ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Sign In to Continue
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Script
                    </>
                  )}
                </Button>
                
                {!user && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    {hasUsedGuestGeneration ? (
                      <span className="text-destructive">Guest limit reached • Sign in for unlimited scripts 🚀</span>
                    ) : (
                      <span className="text-primary">🎉 No account? Try 1 free generation!</span>
                    )}
                  </p>
                )}
              </form>
            </Form>

            {/* Output Section */}
            {generatedScript && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Your Generated Script</h3>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} variant="outline" size="sm" className="border-primary/30 hover:border-primary/50">
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button onClick={handleDownload} variant="outline" size="sm" className="border-primary/30 hover:border-primary/50">
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    <Button onClick={handleSave} variant="outline" size="sm" className="border-secondary/30 hover:border-secondary/50">
                      <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                  </div>
                </div>
                <div className="glass-card p-6 max-h-[500px] overflow-y-auto border-primary/20">
                  <ScriptFormatter content={generatedScript} />
                </div>

                {/* Smart Summary Mode */}
                <div className="mt-6">
                  <SmartSummary 
                    scriptContent={generatedScript}
                    emotionMode={selectedEmotionMode}
                  />
                </div>

                {/* Sources & References */}
                <div className="mt-6">
                  <SourcesPanel 
                    topic={form.getValues("topic")}
                    content={generatedScript}
                    scriptType={form.getValues("scriptType")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20 pb-24 lg:pb-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-foreground/70 mb-4 text-sm sm:text-base">
            Made with ❤️ by <span className="text-primary font-semibold">Sk Julfikar Ali</span> | <span className="text-accent font-semibold">ScriptGenie</span> - Your AI Script Writing Companion
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors">
              <Github className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors">
              <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors">
              <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          </div>
          <p className="text-xs text-foreground/50 mt-6">
            © 2025 Creative Script Craft. All rights reserved.
          </p>
        </div>
      </footer>

      {/* AI Chat Helper - Floating */}
      <AIChatHelper scriptContext={generatedScript} />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav user={user} />
    </div>
  );
};

export default Index;
