import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Copy, Save, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface ScriptEditorProps {
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

export const ScriptEditor = ({ initialContent, onClose, onSave }: ScriptEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const { toast } = useToast();

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

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <Button variant="outline" size="sm" className="gap-2">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Italic className="w-4 h-4" />
          </Button>
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

        {/* Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] bg-input/50 border-border resize-none font-mono"
            placeholder="Edit your script here..."
          />
        </div>
      </Card>
    </div>
  );
};
