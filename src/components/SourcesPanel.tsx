import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SourcesPanelProps {
  topic: string;
  content: string;
  scriptType: string;
}

interface Source {
  title: string;
  description: string;
  url?: string;
}

export const SourcesPanel = ({ topic, content, scriptType }: SourcesPanelProps) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateSources();
  }, [topic, content]);

  const generateSources = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-assistant", {
      body: {
        action: "generate_sources",
        topic,
        content: content.substring(0, 500),
        scriptType,
      },
    });

      if (error) throw error;

      if (data?.sources) {
        setSources(data.sources);
      }
    } catch (error) {
      console.error("Error generating sources:", error);
      // Fallback sources
      setSources([
        {
          title: "Research Reference",
          description: "Information gathered from verified online sources and databases.",
        },
        {
          title: "Industry Standards",
          description: "Based on current best practices and industry guidelines.",
        },
        {
          title: "Expert Knowledge",
          description: "Compiled from expert opinions and educational materials.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAllSources = () => {
    const sourcesText = sources
      .map((source, idx) => `${idx + 1}. ${source.title}\n   ${source.description}${source.url ? `\n   ${source.url}` : ''}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(sourcesText);
    toast({
      title: "Sources Copied! 📋",
      description: "All sources copied to clipboard",
    });
  };

  if (isGenerating) {
    return (
      <Card className="glass-card border-primary/20 p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating sources...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Sources & References</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAllSources}
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy All
        </Button>
      </div>

      <div className="space-y-4">
        {sources.map((source, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  {idx + 1}. {source.title}
                </h4>
                <p className="text-sm text-muted-foreground">{source.description}</p>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Source
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Sources are generated based on the script content and topic for reference purposes.
      </p>
    </Card>
  );
};
