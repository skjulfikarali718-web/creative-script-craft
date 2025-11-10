import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, TrendingUp, Hash, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TopicAnalyzerProps {
  onUseIdea?: (idea: string) => void;
}

export const TopicAnalyzer = ({ onUseIdea }: TopicAnalyzerProps) => {
  const [niche, setNiche] = useState("");
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [viralHooks, setViralHooks] = useState<string[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeTopic = async () => {
    if (!niche.trim()) {
      toast({
        title: "Niche required",
        description: "Please enter your niche or topic.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-topic', {
        body: { niche }
      });

      if (error) throw error;

      setTrendingTopics(data.trendingTopics || []);
      setViralHooks(data.viralHooks || []);
      setSuggestedTitles(data.suggestedTitles || []);

      toast({
        title: "Analysis complete!",
        description: "Content ideas generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">Topic Analyzer & Idea Booster</h3>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter your niche or topic (e.g., Tech, Fitness, Travel)"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyzeTopic()}
        />
        <Button 
          onClick={analyzeTopic} 
          disabled={isAnalyzing}
          className="gradient-btn"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {trendingTopics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h4 className="font-semibold">Trending Subtopics</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onUseIdea?.(topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {viralHooks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            <h4 className="font-semibold">Viral Hook Ideas</h4>
          </div>
          <div className="space-y-2">
            {viralHooks.map((hook, i) => (
              <Card
                key={i}
                className="p-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onUseIdea?.(hook)}
              >
                <p className="text-sm">{hook}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {suggestedTitles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h4 className="font-semibold">Suggested Titles</h4>
          </div>
          <div className="space-y-2">
            {suggestedTitles.map((title, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => onUseIdea?.(title)}
              >
                {title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
