import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { Sparkles, LogIn, Wand2, Check, ArrowRight } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";

const Welcome = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // User is logged in, redirect to main app
          navigate("/app", { replace: true });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // User already logged in, redirect to main app
        navigate("/app", { replace: true });
      } else {
        setIsChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGuestMode = () => {
    // Navigate to app with guest mode flag
    navigate("/app", { state: { guestMode: true } });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-spin" />
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                ScriptGenie
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-Powered Script Writing Companion
            </p>
          </div>

          {/* Welcome Card */}
          <div className="glass-card p-8 rounded-2xl border border-primary/20 shadow-xl shadow-primary/10 animate-scale-in">
            <h2 className="text-2xl font-semibold text-center mb-2">
              Welcome! 👋
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Choose how you want to continue
            </p>

            <div className="space-y-4">
              {/* Sign In Button */}
              <Button
                onClick={() => navigate("/auth")}
                className="w-full h-14 text-lg gradient-btn group"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                Sign In / Sign Up
                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Sign In Benefits */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-sm font-medium text-primary mb-2">Full Access Includes:</p>
                <ul className="space-y-1.5">
                  {[
                    "Unlimited script generations",
                    "Save & manage your scripts",
                    "Access advanced features",
                    "Sync across devices"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-sm text-muted-foreground">
                    or try it first
                  </span>
                </div>
              </div>

              {/* Guest Mode Button */}
              <Button
                onClick={handleGuestMode}
                variant="outline"
                className="w-full h-14 text-lg border-accent/30 hover:border-accent hover:bg-accent/5 group"
                size="lg"
              >
                <Wand2 className="w-5 h-5 mr-3 text-accent group-hover:scale-110 transition-transform" />
                Continue as Guest
                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-2">
                🎁 1 free AI generation • No account needed
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
