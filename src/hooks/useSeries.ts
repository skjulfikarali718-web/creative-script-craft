import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VideoSeries {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  color_theme: string;
  created_at: string;
  updated_at: string;
  script_count?: number;
}

export const useSeries = () => {
  const [series, setSeries] = useState<VideoSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSeries = async () => {
    try {
      setIsLoading(true);
      
      // Fetch series
      const { data: seriesData, error: seriesError } = await supabase
        .from("video_series")
        .select("*")
        .order("created_at", { ascending: false });

      if (seriesError) throw seriesError;

      // Fetch script counts for each series
      const { data: scripts, error: scriptsError } = await supabase
        .from("scripts")
        .select("series_id")
        .not("series_id", "is", null);

      if (scriptsError) throw scriptsError;

      // Count scripts per series
      const countMap = new Map<string, number>();
      scripts?.forEach((script) => {
        if (script.series_id) {
          countMap.set(script.series_id, (countMap.get(script.series_id) || 0) + 1);
        }
      });

      const seriesWithCounts = (seriesData || []).map((s) => ({
        ...s,
        script_count: countMap.get(s.id) || 0,
      }));

      setSeries(seriesWithCounts);
    } catch (error) {
      console.error("Error fetching series:", error);
      toast({
        title: "Error",
        description: "Failed to load series",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSeries = async (name: string, description?: string, colorTheme?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

      setSeries((prev) => [{ ...data, script_count: 0 }, ...prev]);
      toast({
        title: "Success",
        description: "Series created successfully",
      });
      return data;
    } catch (error) {
      console.error("Error creating series:", error);
      toast({
        title: "Error",
        description: "Failed to create series",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSeries = async (id: string, updates: Partial<VideoSeries>) => {
    try {
      const { error } = await supabase
        .from("video_series")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setSeries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      toast({
        title: "Success",
        description: "Series updated successfully",
      });
    } catch (error) {
      console.error("Error updating series:", error);
      toast({
        title: "Error",
        description: "Failed to update series",
        variant: "destructive",
      });
    }
  };

  const deleteSeries = async (id: string) => {
    try {
      const { error } = await supabase
        .from("video_series")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSeries((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Deleted",
        description: "Series deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting series:", error);
      toast({
        title: "Error",
        description: "Failed to delete series",
        variant: "destructive",
      });
    }
  };

  const assignScriptToSeries = async (scriptId: string, seriesId: string | null, episodeNumber?: number) => {
    try {
      const { error } = await supabase
        .from("scripts")
        .update({ 
          series_id: seriesId,
          episode_number: episodeNumber || null,
        })
        .eq("id", scriptId);

      if (error) throw error;

      // Refresh series to update counts
      await fetchSeries();
      
      toast({
        title: "Success",
        description: seriesId ? "Script added to series" : "Script removed from series",
      });
    } catch (error) {
      console.error("Error assigning script to series:", error);
      toast({
        title: "Error",
        description: "Failed to update script",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return {
    series,
    isLoading,
    fetchSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    assignScriptToSeries,
  };
};
