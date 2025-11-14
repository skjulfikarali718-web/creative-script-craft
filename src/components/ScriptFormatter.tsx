import { cn } from "@/lib/utils";

interface ScriptFormatterProps {
  content: string;
  className?: string;
}

export const ScriptFormatter = ({ content, className }: ScriptFormatterProps) => {
  const formatScriptContent = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for specific script elements and apply colors
      if (trimmedLine.startsWith('VISUAL:') || trimmedLine.includes('[Visual') || trimmedLine.includes('Visual:')) {
        return (
          <div key={index} className="my-2">
            <span className="text-cyan-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      if (trimmedLine.startsWith('VOICEOVER:') || trimmedLine.includes('[Voiceover') || trimmedLine.includes('Voiceover:')) {
        return (
          <div key={index} className="my-2">
            <span className="text-amber-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      if (trimmedLine.includes('Trending Audio') || trimmedLine.includes('AUDIO:') || trimmedLine.includes('Music:')) {
        return (
          <div key={index} className="my-2">
            <span className="text-pink-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      if (trimmedLine.includes('Effect') || trimmedLine.includes('EFFECT:') || trimmedLine.includes('[Effect')) {
        return (
          <div key={index} className="my-2">
            <span className="text-purple-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      if (trimmedLine.startsWith('TEXT:') || trimmedLine.includes('[Text') || trimmedLine.includes('Text on screen:')) {
        return (
          <div key={index} className="my-2">
            <span className="text-green-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      if (trimmedLine.includes('CTA') || trimmedLine.includes('Call to Action') || trimmedLine.includes('OUTRO:')) {
        return (
          <div key={index} className="my-2">
            <span className="text-orange-400 font-semibold">{line}</span>
          </div>
        );
      }
      
      // Default text
      return (
        <div key={index} className="my-1">
          <span className="text-foreground">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className={cn("whitespace-pre-wrap font-mono text-sm", className)}>
      {formatScriptContent(content)}
    </div>
  );
};
