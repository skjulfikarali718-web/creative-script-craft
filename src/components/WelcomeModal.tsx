import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogIn } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onGuestMode: () => void;
}

export const WelcomeModal = ({ open, onGuestMode }: WelcomeModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass-card border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to ScriptGenie! 🚀
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-2">
            Your AI-powered script writing companion
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <Button
            onClick={onGuestMode}
            className="w-full h-14 text-lg gradient-btn"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Try Without Signing In
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Get 1 free AI generation • No account needed
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full h-14 text-lg border-primary/30 hover:border-primary/50"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In for Full Access
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Unlimited scripts • Save & edit • Advanced features
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
