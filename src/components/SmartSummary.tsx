import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmartSummaryProps {
  scriptContent: string;
  emotionMode?: string;
}

export const SmartSummary = ({ scriptContent, emotionMode = "neutral" }: SmartSummaryProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<{
    title: string;
    description: string;
    hashtags: string[];
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!scriptContent || scriptContent.length < 50) {
      toast.error("Please generate a script first before creating a summary");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { scriptContent, emotionMode }
      });

      if (error) throw error;

      setSummary(data);
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const copyAll = async () => {
    if (!summary) return;
    
    const allContent = `Title: ${summary.title}\n\nDescription: ${summary.description}\n\nHashtags: ${summary.hashtags.join(' ')}`;
    await copyToClipboard(allContent, "All content");
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={generateSummary}
        disabled={isGenerating || !scriptContent}
        className="w-full"
        variant="outline"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Summary...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Summarize / Caption Mode
          </>
        )}
      </Button>

      {summary && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Smart Summary
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAll}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy All
              </Button>
            </CardTitle>
            <CardDescription>
              Ready for social media posting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">🎬 Title</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(summary.title, "Title")}
                >
                  {copiedField === "Title" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm bg-muted p-3 rounded-md">{summary.title}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">📝 Description</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(summary.description, "Description")}
                >
                  {copiedField === "Description" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm bg-muted p-3 rounded-md">{summary.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">🏷️ Hashtags</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(summary.hashtags.join(' '), "Hashtags")}
                >
                  {copiedField === "Hashtags" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 bg-muted p-3 rounded-md">
                {summary.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
