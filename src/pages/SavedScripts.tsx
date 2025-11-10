import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Download, ArrowLeft, Search, FileText, Calendar, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { ShareScript } from "@/components/ShareScript";

interface SavedScript {
  id: string;
  topic: string;
  content: string;
  script_type: string;
  language: string;
  created_at: string;
}

export default function SavedScripts() {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<SavedScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedScript, setSelectedScript] = useState<SavedScript | null>(null);
  const [renameScript, setRenameScript] = useState<SavedScript | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteScript, setDeleteScript] = useState<SavedScript | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterScripts();
  }, [scripts, searchQuery, typeFilter, languageFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      loadScripts();
    } else {
      setIsLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error("Error loading scripts:", error);
      toast({
        title: "Error",
        description: "Failed to load saved scripts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterScripts = () => {
    let filtered = [...scripts];

    if (searchQuery) {
      filtered = filtered.filter(script =>
        script.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(script => script.script_type === typeFilter);
    }

    if (languageFilter !== "all") {
      filtered = filtered.filter(script => script.language === languageFilter);
    }

    setFilteredScripts(filtered);
  };

  const handleRename = async () => {
    if (!renameScript || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("scripts")
        .update({ topic: newTitle.trim() })
        .eq("id", renameScript.id);

      if (error) throw error;

      setScripts(scripts.map(s => 
        s.id === renameScript.id ? { ...s, topic: newTitle.trim() } : s
      ));
      
      toast({
        title: "Success",
        description: "Script renamed successfully",
      });
      
      setRenameScript(null);
      setNewTitle("");
    } catch (error) {
      console.error("Error renaming script:", error);
      toast({
        title: "Error",
        description: "Failed to rename script",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteScript) return;

    try {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", deleteScript.id);

      if (error) throw error;

      setScripts(scripts.filter(s => s.id !== deleteScript.id));
      
      toast({
        title: "Deleted",
        description: "Script deleted successfully",
      });
      
      setDeleteScript(null);
      if (selectedScript?.id === deleteScript.id) {
        setSelectedScript(null);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    }
  };

  const exportAsTXT = (script: SavedScript) => {
    const content = `${script.topic}\n\nType: ${script.script_type}\nLanguage: ${script.language}\nCreated: ${format(new Date(script.created_at), "PPP")}\n\n${script.content}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.topic.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "✅ Script exported successfully!",
      description: "Downloaded as TXT file",
    });
  };

  const exportAsPDF = (script: SavedScript) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    
    doc.setFontSize(18);
    doc.text(script.topic, margin, 20);
    
    doc.setFontSize(10);
    doc.text(`Type: ${script.script_type} | Language: ${script.language}`, margin, 30);
    doc.text(`Created: ${format(new Date(script.created_at), "PPP")}`, margin, 36);
    
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(script.content, maxWidth);
    doc.text(lines, margin, 46);
    
    doc.save(`${script.topic.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    
    toast({
      title: "✅ Script exported successfully!",
      description: "Downloaded as PDF file",
    });
  };

  const getScriptTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      explainer: "Explainer",
      narrative: "Narrative",
      outline: "Outline",
    };
    return labels[type] || type;
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      english: "English",
      bengali: "Bengali",
      hindi: "Hindi",
    };
    return labels[lang] || lang;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="glass-card p-8 max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Sign In Required</h2>
            <p className="text-muted-foreground">
              You're using guest mode — sign in to save and manage your scripts.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
              Back to Home
            </Button>
            <Button onClick={() => navigate("/auth")} className="flex-1">
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedScript) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedScript(null)}
              className="hover-lift"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold flex-1">{selectedScript.topic}</h1>
            <Button
              onClick={() => {
                const menu = document.createElement("div");
                menu.className = "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50";
                menu.innerHTML = `
                  <div class="bg-card p-6 rounded-lg shadow-lg space-y-3 max-w-xs w-full mx-4">
                    <h3 class="font-semibold text-lg mb-4">Export Script</h3>
                    <button id="export-txt" class="w-full p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition">
                      Export as TXT
                    </button>
                    <button id="export-pdf" class="w-full p-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition">
                      Export as PDF
                    </button>
                    <button id="cancel" class="w-full p-3 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition">
                      Cancel
                    </button>
                  </div>
                `;
                document.body.appendChild(menu);
                
                document.getElementById("export-txt")?.addEventListener("click", () => {
                  exportAsTXT(selectedScript);
                  document.body.removeChild(menu);
                });
                
                document.getElementById("export-pdf")?.addEventListener("click", () => {
                  exportAsPDF(selectedScript);
                  document.body.removeChild(menu);
                });
                
                document.getElementById("cancel")?.addEventListener("click", () => {
                  document.body.removeChild(menu);
                });
                
                menu.addEventListener("click", (e) => {
                  if (e.target === menu) {
                    document.body.removeChild(menu);
                  }
                });
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
          
          <Card className="glass-card p-6">
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {getScriptTypeLabel(selectedScript.script_type)}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {getLanguageLabel(selectedScript.language)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(selectedScript.created_at), "PPP")}
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {selectedScript.content}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold">Saved Scripts</h1>
            <p className="text-muted-foreground">Manage and organize your generated scripts</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Button>
        </div>

        <Card className="glass-card p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Script Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="explainer">Explainer</SelectItem>
                <SelectItem value="narrative">Narrative</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {filteredScripts.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {scripts.length === 0 ? "No saved scripts yet" : "No scripts found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {scripts.length === 0 
                ? "Generate your first script to get started!" 
                : "Try adjusting your search or filters"}
            </p>
            {scripts.length === 0 && (
              <Button onClick={() => navigate("/")}>
                Create Your First Script
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScripts.map((script) => (
              <Card
                key={script.id}
                className="glass-card p-6 space-y-4 hover-scale cursor-pointer transition-all"
                onClick={() => setSelectedScript(script)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                      {script.topic}
                    </h3>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full shrink-0">
                      {getScriptTypeLabel(script.script_type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(script.created_at), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {getLanguageLabel(script.language)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {script.content.substring(0, 150)}...
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameScript(script);
                      setNewTitle(script.topic);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Rename
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ShareScript scriptId={script.id} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      const menu = document.createElement("div");
                      menu.className = "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50";
                      menu.innerHTML = `
                        <div class="bg-card p-6 rounded-lg shadow-lg space-y-3 max-w-xs w-full mx-4">
                          <h3 class="font-semibold text-lg mb-4">Export Script</h3>
                          <button id="export-txt" class="w-full p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition">
                            Export as TXT
                          </button>
                          <button id="export-pdf" class="w-full p-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition">
                            Export as PDF
                          </button>
                          <button id="cancel" class="w-full p-3 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition">
                            Cancel
                          </button>
                        </div>
                      `;
                      document.body.appendChild(menu);
                      
                      document.getElementById("export-txt")?.addEventListener("click", () => {
                        exportAsTXT(script);
                        document.body.removeChild(menu);
                      });
                      
                      document.getElementById("export-pdf")?.addEventListener("click", () => {
                        exportAsPDF(script);
                        document.body.removeChild(menu);
                      });
                      
                      document.getElementById("cancel")?.addEventListener("click", () => {
                        document.body.removeChild(menu);
                      });
                      
                      menu.addEventListener("click", (e) => {
                        if (e.target === menu) {
                          document.body.removeChild(menu);
                        }
                      });
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteScript(script);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!renameScript} onOpenChange={(open) => !open && setRenameScript(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Script</DialogTitle>
            <DialogDescription>
              Enter a new title for your script
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Script title"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameScript(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteScript} onOpenChange={(open) => !open && setDeleteScript(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteScript?.topic}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
