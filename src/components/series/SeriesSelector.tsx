import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesDialog } from "./SeriesDialog";
import type { VideoSeries } from "@/hooks/useSeries";

interface SeriesSelectorProps {
  value: string | null;
  onChange: (seriesId: string | null) => void;
  disabled?: boolean;
}

export const SeriesSelector = ({ value, onChange, disabled }: SeriesSelectorProps) => {
  const [series, setSeries] = useState<VideoSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const { data, error } = await supabase
        .from("video_series")
        .select("*")
        .order("name");

      if (error) throw error;
      setSeries(data || []);
    } catch (error) {
      console.error("Error loading series:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (name: string, description?: string, colorTheme?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("video_series")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          color_theme: colorTheme || "#8b5cf6",
        })
        .select()
        .single();

      if (error) throw error;

      setSeries((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.id);
    } catch (error) {
      console.error("Error creating series:", error);
    }
  };

  return (
    <div className="flex gap-2">
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="No series">
            {value ? (
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                {series.find((s) => s.id === value)?.name || "Select series"}
              </div>
            ) : (
              "No series"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No series</SelectItem>
          {series.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color_theme }}
                />
                {s.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <SeriesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleCreate}
      />
    </div>
  );
};
