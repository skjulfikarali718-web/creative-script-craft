import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SeriesList } from "@/components/series/SeriesList";
import { SeriesDetail } from "@/components/series/SeriesDetail";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { VideoSeries } from "@/hooks/useSeries";

const Series = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<VideoSeries | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleViewScript = (script: any) => {
    // Navigate to saved scripts with the script selected
    navigate("/saved", { state: { viewScript: script } });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Film className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold gradient-text">Series</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/auth")}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {selectedSeries ? (
          <SeriesDetail
            series={selectedSeries}
            onBack={() => setSelectedSeries(null)}
            onViewScript={handleViewScript}
          />
        ) : (
          <SeriesList onSelectSeries={setSelectedSeries} />
        )}
      </main>

      <MobileBottomNav user={user} />
    </div>
  );
};

export default Series;
