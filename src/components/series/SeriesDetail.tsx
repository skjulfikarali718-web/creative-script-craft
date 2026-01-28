import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Film, FileText, GripVertical, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { VideoSeries } from "@/hooks/useSeries";

interface Script {
  id: string;
  topic: string;
  content: string;
  script_type: string;
  language: string;
  created_at: string;
  episode_number: number | null;
}

interface SeriesDetailProps {
  series: VideoSeries;
  onBack: () => void;
  onViewScript: (script: Script) => void;
}

export const SeriesDetail = ({ series, onBack, onViewScript }: SeriesDetailProps) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadScripts();
  }, [series.id]);

  const loadScripts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("scripts")
        .select("id, topic, content, script_type, language, created_at, episode_number")
        .eq("series_id", series.id)
        .order("episode_number", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error("Error loading scripts:", error);
      toast({
        title: "Error",
        description: "Failed to load scripts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromSeries = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from("scripts")
        .update({ series_id: null, episode_number: null })
        .eq("id", scriptId);

      if (error) throw error;

      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      toast({
        title: "Removed",
        description: "Script removed from series",
      });
    } catch (error) {
      console.error("Error removing script:", error);
      toast({
        title: "Error",
        description: "Failed to remove script",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${series.color_theme}20` }}
          >
            <Film className="w-6 h-6" style={{ color: series.color_theme }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{series.name}</h2>
            {series.description && (
              <p className="text-muted-foreground">{series.description}</p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No scripts in this series</h3>
          <p className="text-muted-foreground">
            Add scripts from your saved scripts page
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script, index) => (
            <Card
              key={script.id}
              className="glass-card p-4 flex items-center gap-4 hover-scale cursor-pointer group"
              onClick={() => onViewScript(script)}
            >
              <div className="flex items-center gap-3 text-muted-foreground">
                <GripVertical className="w-5 h-5 opacity-50" />
                <span className="text-lg font-bold w-8 text-center">
                  {script.episode_number || index + 1}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{script.topic}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{script.script_type}</span>
                  <span>•</span>
                  <span>{format(new Date(script.created_at), "MMM dd, yyyy")}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromSeries(script.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
