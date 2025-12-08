import { useState, useEffect } from "react";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase connection
    const checkConnection = async () => {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('scripts').select('id').limit(1);
        setIsOnline(!error);
      } catch {
        setIsOnline(false);
      } finally {
        setIsSyncing(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isSyncing) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Syncing
      </Badge>
    );
  }

  return (
    <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
      {isOnline ? (
        <>
          <Cloud className="w-3 h-3" />
          Synced
        </>
      ) : (
        <>
          <CloudOff className="w-3 h-3" />
          Offline
        </>
      )}
    </Badge>
  );
};
