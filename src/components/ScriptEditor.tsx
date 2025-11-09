import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Copy, Save, Download, X, Sparkles, Maximize2, Minimize2, Heart, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScriptEditorProps {
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

export const ScriptEditor = ({ initialContent, onClose, onSave }: ScriptEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [selectedText, setSelectedText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleTextSelection = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setSelectedText(selected);
    }
  };

  const enhanceText = async (action: "expand" | "shorten" | "emotional" | "polish") => {
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to enhance.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-script', {
        body: { text: selectedText, action }
      });

      if (error) throw error;

      // Replace selected text with enhanced version
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + data.enhancedText + content.substring(end);
        setContent(newContent);
      }

      toast({
        title: "Text enhanced!",
        description: `Successfully applied ${action} enhancement.`,
      });
    } catch (error) {
      toast({
        title: "Enhancement failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const regenerateParagraph = async () => {
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select a paragraph to regenerate.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-script', {
        body: { text: selectedText, action: "regenerate" }
      });

      if (error) throw error;

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + data.enhancedText + content.substring(end);
        setContent(newContent);
      }

      toast({
        title: "Paragraph regenerated!",
        description: "Your text has been rewritten.",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard.",
    });
  };

  const handleSave = () => {
    onSave(content);
    toast({
      title: "Saved!",
      description: "Your changes have been saved.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Script saved as script.txt",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Script Editor</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* AI Enhancement Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">AI Enhance:</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => enhanceText("expand")}
              disabled={!selectedText || isEnhancing}
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => enhanceText("shorten")}
              disabled={!selectedText || isEnhancing}
            >
              <Minimize2 className="w-4 h-4" />
              Shorten
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => enhanceText("emotional")}
              disabled={!selectedText || isEnhancing}
            >
              <Heart className="w-4 h-4" />
              Emotional
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => enhanceText("polish")}
              disabled={!selectedText || isEnhancing}
            >
              <Sparkles className="w-4 h-4" />
              Polish
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={regenerateParagraph}
              disabled={!selectedText || isEnhancing}
            >
              <Wand2 className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button size="sm" className="gap-2 gradient-btn" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>

        {/* Editor with Compare View */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="editor" className="h-full">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="compare">Compare Versions</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="p-6">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleTextSelection}
                className="min-h-[500px] bg-input/50 border-border resize-none font-mono"
                placeholder="Edit your script here... Select text to use AI enhancements."
              />
            </TabsContent>
            <TabsContent value="compare" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Original</h3>
                  <div className="bg-muted/50 p-4 rounded-md min-h-[500px] whitespace-pre-wrap font-mono text-sm">
                    {originalContent}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Current</h3>
                  <div className="bg-muted/50 p-4 rounded-md min-h-[500px] whitespace-pre-wrap font-mono text-sm">
                    {content}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};
