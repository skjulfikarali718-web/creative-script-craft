import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SceneSuggestion {
  title: string;
  background: string;
  camera: string;
  lighting: string;
  tone: string;
}

interface VisualSceneSuggestionProps {
  scriptContent: string;
  scriptType: string;
}

export const VisualSceneSuggestion = ({ scriptContent, scriptType }: VisualSceneSuggestionProps) => {
  const [scenes, setScenes] = useState<SceneSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-visual-suggestions', {
        body: { scriptContent, scriptType }
      });

      if (error) throw error;

      setScenes(data.scenes);

      toast({
        title: "Visual suggestions generated!",
        description: "Scroll through the scene ideas.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportSummary = () => {
    const summary = scenes.map((scene, i) => 
      `Scene ${i + 1}: ${scene.title}\n` +
      `Background: ${scene.background}\n` +
      `Camera: ${scene.camera}\n` +
      `Lighting: ${scene.lighting}\n` +
      `Tone: ${scene.tone}\n\n`
    ).join('');

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-storyboard.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Visual storyboard saved.",
    });
  };

  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          AI Visual Scene Suggestions
        </h3>
        <Button 
          onClick={generateSuggestions} 
          disabled={isGenerating}
          className="gradient-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Visual Ideas"
          )}
        </Button>
      </div>

      {scenes.length > 0 && (
        <div className="space-y-4">
          <Carousel className="w-full">
            <CarouselContent>
              {scenes.map((scene, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="p-4 space-y-2 h-full bg-muted/50">
                    <h4 className="font-semibold text-primary">Scene {index + 1}</h4>
                    <h5 className="font-medium">{scene.title}</h5>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Background:</span> {scene.background}</p>
                      <p><span className="font-medium">Camera:</span> {scene.camera}</p>
                      <p><span className="font-medium">Lighting:</span> {scene.lighting}</p>
                      <p><span className="font-medium">Tone:</span> {scene.tone}</p>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

          <Button onClick={exportSummary} variant="outline" className="w-full">
            <Download className="w-4 h-4" />
            Export Storyboard Summary
          </Button>
        </div>
      )}
    </Card>
  );
};
