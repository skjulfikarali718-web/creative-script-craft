import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export const GuestModeBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-primary/20 border-b border-primary/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="text-foreground/90">
            You're in <span className="font-semibold text-primary">Guest Mode</span>. 
            <span className="hidden sm:inline"> Sign in to save your scripts permanently.</span>
          </span>
        </div>
        <Button 
          onClick={() => navigate("/auth")} 
          size="sm" 
          className="gradient-btn text-xs sm:text-sm"
        >
          Sign In Now
        </Button>
      </div>
    </div>
  );
};
