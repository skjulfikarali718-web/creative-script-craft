import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hash, MessageSquare, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CaptionHashtagGeneratorProps {
  scriptContent: string;
  scriptTopic: string;
}

export const CaptionHashtagGenerator = ({ scriptContent, scriptTopic }: CaptionHashtagGeneratorProps) => {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-captions-hashtags', {
        body: { scriptContent, scriptTopic }
      });

      if (error) throw error;

      setCaption(data.caption);
      setHashtags(data.hashtags);

      toast({
        title: "Generated!",
        description: "Caption and hashtags are ready.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = () => {
    const text = `${caption}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption and hashtags copied to clipboard.",
    });
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard.",
    });
  };

  const copyHashtags = () => {
    navigator.clipboard.writeText(hashtags.join(' '));
    toast({
      title: "Copied!",
      description: "Hashtags copied to clipboard.",
    });
  };

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Social Media Content</h3>
        <Button 
          onClick={generateContent} 
          disabled={isGenerating}
          className="gradient-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Caption & Hashtags"
          )}
        </Button>
      </div>

      {caption && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <h4 className="font-medium">Caption</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={copyCaption}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="bg-muted/50 p-4 rounded-md text-sm">{caption}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <h4 className="font-medium">Hashtags</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={copyHashtags}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <span key={index} className="text-sm text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={copyAll} variant="outline" className="w-full">
            <Copy className="w-4 h-4" />
            Copy All
          </Button>
        </div>
      )}
    </Card>
  );
};
