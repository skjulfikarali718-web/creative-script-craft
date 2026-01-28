import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { VideoSeries } from "@/hooks/useSeries";

const COLOR_OPTIONS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
];

interface SeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series?: VideoSeries | null;
  onSave: (name: string, description?: string, colorTheme?: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<VideoSeries>) => Promise<void>;
}

export const SeriesDialog = ({
  open,
  onOpenChange,
  series,
  onSave,
  onUpdate,
}: SeriesDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorTheme, setColorTheme] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!series;

  useEffect(() => {
    if (series) {
      setName(series.name);
      setDescription(series.description || "");
      setColorTheme(series.color_theme);
    } else {
      setName("");
      setDescription("");
      setColorTheme(COLOR_OPTIONS[0]);
    }
  }, [series, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && onUpdate && series) {
        await onUpdate(series.id, { name, description, color_theme: colorTheme });
      } else {
        await onSave(name, description, colorTheme);
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Series" : "Create New Series"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Series Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tech Reviews 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this series..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorTheme(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    colorTheme === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
