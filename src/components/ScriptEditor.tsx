import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Save, Download, X, Sparkles, Maximize2, Minimize2, Heart, Wand2, Smile, Lightbulb, Drama, Brain, Briefcase, HeartHandshake, Undo2, Search, FileCheck, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScriptEditorProps {
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

interface Source {
  text: string;
  addedAt: string;
}

export const ScriptEditor = ({ initialContent, onClose, onSave }: ScriptEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [versionHistory, setVersionHistory] = useState<string[]>([initialContent]);
  const [selectedText, setSelectedText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentTone, setCurrentTone] = useState<string | null>(null);
  const [researchMode, setResearchMode] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<any>(null);
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

  const factCheck = async () => {
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select text to fact-check.",
        variant: "destructive",
      });
      return;
    }

    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-assistant', {
        body: { text: selectedText, action: 'fact-check' }
      });

      if (error) throw error;

      const result = JSON.parse(data.result);
      setFactCheckResult(result);
      
      toast({
        title: result.verified ? "Fact verified!" : "Fact needs review",
        description: result.summary,
      });
    } catch (error) {
      toast({
        title: "Fact check failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResearching(false);
    }
  };

  const smoothIntegrate = async () => {
    if (!selectedText || !factCheckResult) {
      toast({
        title: "No fact to integrate",
        description: "Please fact-check text first.",
        variant: "destructive",
      });
      return;
    }

    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-assistant', {
        body: { 
          text: selectedText, 
          action: 'smooth-integrate',
          context: { fact: factCheckResult.summary }
        }
      });

      if (error) throw error;

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + data.result + content.substring(end);
        saveVersion(newContent);
        setContent(newContent);
      }

      // Add source
      if (factCheckResult.sources && factCheckResult.sources.length > 0) {
        const newSources = factCheckResult.sources.map((src: string) => ({
          text: src,
          addedAt: new Date().toISOString()
        }));
        setSources(prev => [...prev, ...newSources]);
      }

      toast({
        title: "Fact integrated!",
        description: "Text rewritten with verified information.",
      });
      setFactCheckResult(null);
    } catch (error) {
      toast({
        title: "Integration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResearching(false);
    }
  };

  const expandFact = async () => {
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select a keyword to expand.",
        variant: "destructive",
      });
      return;
    }

    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-assistant', {
        body: { text: selectedText, action: 'expand-fact' }
      });

      if (error) throw error;

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const expandedText = `${selectedText} (${data.result})`;
        const newContent = content.substring(0, start) + expandedText + content.substring(end);
        saveVersion(newContent);
        setContent(newContent);
      }

      toast({
        title: "Fact expanded!",
        description: "Additional information added.",
      });
    } catch (error) {
      toast({
        title: "Expansion failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResearching(false);
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
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Script Editor</h2>
            <div className="flex items-center gap-2">
              <Switch 
                id="research-mode" 
                checked={researchMode}
                onCheckedChange={setResearchMode}
              />
              <Label htmlFor="research-mode" className="text-sm">
                Research Mode
              </Label>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Research Mode Toolbar */}
        {researchMode && (
          <div className="p-4 border-b border-border bg-accent/10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Search className="w-3 h-3" />
                Research Assistant
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={factCheck}
                disabled={!selectedText || isResearching}
              >
                {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                Fact Check
              </Button>
              {factCheckResult && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={smoothIntegrate}
                  disabled={isResearching}
                >
                  <Sparkles className="w-4 h-4" />
                  Smooth Integrate
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={expandFact}
                disabled={!selectedText || isResearching}
              >
                <Lightbulb className="w-4 h-4" />
                Quick Expand
              </Button>
              <div className="flex-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowSources(!showSources)}
              >
                <BookOpen className="w-4 h-4" />
                {showSources ? "Hide" : "Show"} Sources ({sources.length})
              </Button>
            </div>
            {factCheckResult && (
              <div className="p-3 rounded-md bg-background/50 border border-border">
                <div className="flex items-start gap-2">
                  <Badge variant={factCheckResult.verified ? "default" : "destructive"}>
                    {factCheckResult.verified ? "Verified" : "Unverified"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{factCheckResult.summary}</p>
                    {factCheckResult.sources && factCheckResult.sources.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sources: {factCheckResult.sources.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Tone Control Toolbar */}
        {!researchMode && (
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
        )}

        {/* Editor with Compare View and Sources */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="editor" className="h-full">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="compare">Compare Versions</TabsTrigger>
              {sources.length > 0 && <TabsTrigger value="sources">Sources & References</TabsTrigger>}
            </TabsList>
            <TabsContent value="editor" className="p-6">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleTextSelection}
                className={`min-h-[500px] bg-input/50 border-border resize-none font-mono ${researchMode && selectedText ? 'selection:bg-yellow-200/30 dark:selection:bg-yellow-500/30' : ''}`}
                placeholder={researchMode ? "Edit your script here... Select text to fact-check or enrich with verified information." : "Edit your script here... Select text to use AI enhancements."}
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
            {sources.length > 0 && (
              <TabsContent value="sources" className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sources & References</h3>
                    <Badge variant="secondary">{sources.length} source{sources.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <ScrollArea className="h-[500px] rounded-md border border-border p-4">
                    <div className="space-y-3">
                      {sources.map((source, index) => (
                        <div key={index} className="p-3 rounded-md bg-muted/50 border border-border">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="shrink-0">#{index + 1}</Badge>
                            <div className="flex-1">
                              <p className="text-sm">{source.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Added: {new Date(source.addedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Card>
    </div>
  );
};
