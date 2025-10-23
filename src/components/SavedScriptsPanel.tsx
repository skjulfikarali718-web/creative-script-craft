import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Edit, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SavedScript {
  id: string;
  topic: string;
  content: string;
  script_type: string;
  language: string;
  created_at: string;
}

interface SavedScriptsPanelProps {
  onView: (script: SavedScript) => void;
  onEdit: (script: SavedScript) => void;
}

export const SavedScriptsPanel = ({ onView, onEdit }: SavedScriptsPanelProps) => {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadScripts();
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("scripts").delete().eq("id", id);
      if (error) throw error;
      
      setScripts(scripts.filter((s) => s.id !== id));
      toast({
        title: "Deleted",
        description: "Script deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting script:", error);
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <p>No saved scripts yet. Generate your first script to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scripts.map((script) => (
        <Card key={script.id} className="glass-card p-6 space-y-4 hover-scale">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-2">{script.topic}</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full shrink-0">
                {script.script_type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(script.created_at), "MMM dd, yyyy")}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {script.content.substring(0, 150)}...
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 hover-lift"
              onClick={() => onView(script)}
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 hover-lift"
              onClick={() => onEdit(script)}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 hover-lift"
              onClick={() => handleDelete(script.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
