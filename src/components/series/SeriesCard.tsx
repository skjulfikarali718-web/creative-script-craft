import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Film, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VideoSeries } from "@/hooks/useSeries";

interface SeriesCardProps {
  series: VideoSeries;
  onEdit: (series: VideoSeries) => void;
  onDelete: (id: string) => void;
  onClick: (series: VideoSeries) => void;
}

export const SeriesCard = ({ series, onEdit, onDelete, onClick }: SeriesCardProps) => {
  return (
    <Card
      className="glass-card p-6 hover-scale cursor-pointer group relative overflow-hidden"
      onClick={() => onClick(series)}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: series.color_theme }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${series.color_theme}20` }}
          >
            <Film className="w-5 h-5" style={{ color: series.color_theme }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{series.name}</h3>
            {series.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {series.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(series); }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(series.id); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>{series.script_count || 0} scripts</span>
      </div>
    </Card>
  );
};
