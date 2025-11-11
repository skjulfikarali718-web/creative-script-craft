import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Save, Download, X, Sparkles, Maximize2, Minimize2, Heart, Wand2, Smile, Lightbulb, Drama, Brain, Briefcase, HeartHandshake, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ScriptEditorProps {
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

export const ScriptEditor = ({ initialContent, onClose, onSave }: ScriptEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [versionHistory, setVersionHistory] = useState<string[]>([initialContent]);
  const [selectedText, setSelectedText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentTone, setCurrentTone] = useState<string | null>(null);
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
        saveVersion(newContent);
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

  const applyTone = async (tone: "funny" | "motivational" | "dramatic" | "philosophical" | "professional" | "emotional", applyToAll: boolean = false) => {
    const textToModify = applyToAll ? content : selectedText;
    
    if (!textToModify) {
      toast({
        title: "No text selected",
        description: applyToAll ? "No content to modify." : "Please select some text to apply tone.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    setCurrentTone(tone);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-script', {
        body: { text: textToModify, action: tone }
      });

      if (error) throw error;

      if (applyToAll) {
        saveVersion(data.enhancedText);
        setContent(data.enhancedText);
      } else {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.substring(0, start) + data.enhancedText + content.substring(end);
          saveVersion(newContent);
          setContent(newContent);
        }
      }

      toast({
        title: "Tone applied!",
        description: `Successfully applied ${tone} tone.`,
      });
    } catch (error) {
      toast({
        title: "Tone adjustment failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
      setCurrentTone(null);
    }
  };

  const saveVersion = (newContent: string) => {
    setVersionHistory(prev => [...prev, newContent]);
  };

  const undoLastChange = () => {
    if (versionHistory.length > 1) {
      const newHistory = [...versionHistory];
      newHistory.pop();
      setVersionHistory(newHistory);
      setContent(newHistory[newHistory.length - 1]);
      toast({
        title: "Undone!",
        description: "Reverted to previous version.",
      });
    } else {
      toast({
        title: "Nothing to undo",
        description: "You're at the original version.",
        variant: "destructive",
      });
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

        {/* AI Tone Control Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Tone Engine
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => applyTone("funny", false)}
              disabled={!selectedText || isEnhancing}
            >
              <Smile className="w-4 h-4" />
              Funny
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => applyTone("motivational", false)}
              disabled={!selectedText || isEnhancing}
            >
              <Lightbulb className="w-4 h-4" />
              Motivational
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => applyTone("dramatic", false)}
              disabled={!selectedText || isEnhancing}
            >
              <Drama className="w-4 h-4" />
              Dramatic
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => applyTone("philosophical", false)}
              disabled={!selectedText || isEnhancing}
            >
              <Brain className="w-4 h-4" />
              Philosophical
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => applyTone("professional", false)}
              disabled={!selectedText || isEnhancing}
            >
              <Briefcase className="w-4 h-4" />
              Professional
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => applyTone("emotional", false)}
              disabled={!selectedText || isEnhancing}
            >
              <HeartHandshake className="w-4 h-4" />
              Emotional
            </Button>
            {selectedText && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => currentTone && applyTone(currentTone as any, true)}
                  disabled={isEnhancing || !currentTone}
                >
                  Apply to All
                </Button>
              </>
            )}
          </div>
          
          <Separator />
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Enhance:</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2" 
              onClick={() => enhanceText("expand")}
              disabled={!selectedText || isEnhancing}
            >
              <Maximize2 className="w-3 h-3" />
              Expand
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => enhanceText("shorten")}
              disabled={!selectedText || isEnhancing}
            >
              <Minimize2 className="w-3 h-3" />
              Shorten
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => enhanceText("polish")}
              disabled={!selectedText || isEnhancing}
            >
              <Sparkles className="w-3 h-3" />
              Polish
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={regenerateParagraph}
              disabled={!selectedText || isEnhancing}
            >
              <Wand2 className="w-3 h-3" />
              Regenerate
            </Button>
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={undoLastChange}
              disabled={versionHistory.length <= 1}
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
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
          
          {isEnhancing && currentTone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Sparkles className="w-4 h-4" />
              Rewriting in {currentTone} tone...
            </div>
          )}
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
