import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";

interface GuestLimitModalProps {
  open: boolean;
  onClose: () => void;
}

export const GuestLimitModal = ({ open, onClose }: GuestLimitModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-accent/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Love ScriptGenie? ✨
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-2">
            You've used your free guest generation!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Crown className="w-5 h-5 text-accent" />
              <span className="font-semibold">Sign in to unlock:</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
              <li>✓ Unlimited AI script generations</li>
              <li>✓ Save and organize your scripts</li>
              <li>✓ Access all 9 script types</li>
              <li>✓ Edit and refine your content</li>
              <li>✓ Download in multiple formats</li>
            </ul>
          </div>
          
          <Button
            onClick={() => navigate("/auth")}
            className="w-full h-12 text-lg gradient-btn"
            size="lg"
          >
            Sign In / Create Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
