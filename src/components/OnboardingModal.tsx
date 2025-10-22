import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import mockupDesktop from "@/assets/mockup-desktop.jpg";
import mockupMobile from "@/assets/mockup-mobile.jpg";

const ONBOARDING_KEY = "scriptgenie_onboarding_seen";

export const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      // Delay opening slightly for smooth entrance
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const steps = [
    {
      title: "Welcome to ScriptGenie",
      description: "Your AI-powered script generation companion. Create engaging content in seconds with the power of artificial intelligence.",
      image: heroBanner,
      icon: Sparkles,
      features: [
        "Generate scripts in multiple languages",
        "Choose from various script types",
        "Save and manage your history"
      ]
    },
    {
      title: "Powerful AI Generation",
      description: "Our advanced AI understands your topic and creates professional scripts tailored to your needs.",
      image: mockupDesktop,
      icon: Zap,
      features: [
        "Explainer videos",
        "Narrative storytelling",
        "Structured outlines"
      ]
    },
    {
      title: "Access Anywhere",
      description: "Generate scripts on any device. Your work syncs automatically across all your devices.",
      image: mockupMobile,
      icon: Clock,
      features: [
        "Mobile-friendly interface",
        "Instant script generation",
        "Complete history tracking"
      ]
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-primary/20">
        <div className="relative">
          {/* Hero Image */}
          <div className="relative h-64 overflow-hidden">
            <img 
              src={currentStep.image} 
              alt={currentStep.title}
              className="w-full h-full object-cover animate-scale-in"
              key={step}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-8 animate-fade-in" key={`content-${step}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10 animate-pulse">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                {currentStep.title}
              </h2>
            </div>

            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {currentStep.description}
            </p>

            <div className="space-y-3 mb-8">
              {currentStep.features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 animate-fade-in hover-lift"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === step 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-muted hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={step === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="text-muted-foreground"
              >
                Skip
              </Button>

              <Button
                onClick={handleNext}
                className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              >
                {step === 2 ? "Get Started" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
