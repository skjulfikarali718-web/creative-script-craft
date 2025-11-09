import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Download, Loader2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceoverGeneratorProps {
  scriptContent: string;
}

export const VoiceoverGenerator = ({ scriptContent }: VoiceoverGeneratorProps) => {
  const [voice, setVoice] = useState<"male" | "female">("male");
  const [tone, setTone] = useState<"calm" | "energetic" | "dramatic">("calm");
  const [audioUrl, setAudioUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const generateVoiceover = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-voiceover', {
        body: { text: scriptContent, voice, tone }
      });

      if (error) throw error;

      // Convert base64 to blob URL
      const audioBlob = await fetch(`data:audio/mp3;base64,${data.audioContent}`).then(r => r.blob());
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Voiceover generated!",
        description: "Your audio is ready to play or download.",
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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'voiceover.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Downloaded!",
        description: "Voiceover saved as voiceover.mp3",
      });
    }
  };

  return (
    <Card className="glass-card p-6 space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Mic className="w-5 h-5" />
        AI Voiceover Generator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice</label>
          <Select value={voice} onValueChange={(v) => setVoice(v as "male" | "female")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tone</label>
          <Select value={tone} onValueChange={(t) => setTone(t as "calm" | "energetic" | "dramatic")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calm">Calm</SelectItem>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="dramatic">Dramatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={generateVoiceover} 
        disabled={isGenerating || !scriptContent}
        className="w-full gradient-btn"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Voiceover...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Generate Voice
          </>
        )}
      </Button>

      {audioUrl && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-md">
          <audio 
            ref={audioRef} 
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="flex gap-2">
            <Button 
              onClick={togglePlay}
              variant="outline"
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </Button>
            <Button 
              onClick={downloadAudio}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4" />
              Download MP3
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
