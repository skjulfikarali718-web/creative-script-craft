import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Copy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Script {
  id: string;
  topic: string;
  language: string;
  script_type: string;
  content: string;
  created_at: string;
}

export const ScriptHistory = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load script history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteScript = async (id: string) => {
    try {
      const { error } = await supabase.from("scripts").delete().eq("id", id);

      if (error) throw error;

      setScripts(scripts.filter((s) => s.id !== id));
      if (selectedScript?.id === id) setSelectedScript(null);

      toast({
        title: "Deleted",
        description: "Script removed from history",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    }
  };

  const copyScript = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard",
    });
  };

  const getScriptTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      explainer: "🎓 Explainer",
      narrative: "🎭 Narrative",
      outline: "🧩 Outline",
    };
    return labels[type] || type;
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      english: "English",
      bengali: "বাংলা",
      hindi: "हिंदी",
    };
    return labels[lang] || lang;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scripts saved yet. Generate your first script to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Script List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Script History</CardTitle>
          <CardDescription>{scripts.length} saved scripts</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  onClick={() => setSelectedScript(script)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                    selectedScript?.id === script.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{script.topic}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{getScriptTypeLabel(script.script_type)}</span>
                        <span>•</span>
                        <span>{getLanguageLabel(script.language)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScript(script.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(script.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Script Preview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          {selectedScript && (
            <Button onClick={() => copyScript(selectedScript.content)} variant="outline" size="sm" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Script
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {selectedScript ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedScript.topic}</h3>
                  <div className="flex gap-2 text-sm text-muted-foreground mb-4">
                    <span>{getScriptTypeLabel(selectedScript.script_type)}</span>
                    <span>•</span>
                    <span>{getLanguageLabel(selectedScript.language)}</span>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-input/50 p-4 rounded-lg border border-border">
                  {selectedScript.content}
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Select a script to preview
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
