import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Film } from "lucide-react";
import { SeriesCard } from "./SeriesCard";
import { SeriesDialog } from "./SeriesDialog";
import { useSeries, type VideoSeries } from "@/hooks/useSeries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SeriesListProps {
  onSelectSeries: (series: VideoSeries) => void;
}

export const SeriesList = ({ onSelectSeries }: SeriesListProps) => {
  const { series, isLoading, createSeries, updateSeries, deleteSeries } = useSeries();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<VideoSeries | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (name: string, description?: string, colorTheme?: string) => {
    await createSeries(name, description, colorTheme);
  };

  const handleEdit = (s: VideoSeries) => {
    setEditingSeries(s);
    setDialogOpen(true);
  };

  const handleUpdate = async (id: string, updates: Partial<VideoSeries>) => {
    await updateSeries(id, updates);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSeries(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Series</h2>
          <p className="text-muted-foreground">Organize your scripts by projects</p>
        </div>
        <Button onClick={() => { setEditingSeries(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Series
        </Button>
      </div>

      {series.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No series yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first series to organize your scripts
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Series
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <SeriesCard
              key={s.id}
              series={s}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
              onClick={onSelectSeries}
            />
          ))}
        </div>
      )}

      <SeriesDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSeries(null);
        }}
        series={editingSeries}
        onSave={handleCreate}
        onUpdate={handleUpdate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the series but keep all scripts. Scripts will be unassigned from this series.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
