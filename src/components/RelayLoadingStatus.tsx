import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import { cn } from '@/lib/utils';

interface RelayLoadingStatusProps {
  goalsLoaded: number;
  targetGoals?: number;
}

export const RelayLoadingStatus = ({ goalsLoaded, targetGoals = 30 }: RelayLoadingStatusProps) => {
  const relayStatuses = useAppSelector((state) => state.relays.relayStatuses);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const connectedRelays = relayStatuses.filter((r) => r.connected).length;
  const totalRelays = relayStatuses.length;

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto">
      <div className="relative">
        <Spinner size="lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {goalsLoaded}
          </span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          Loading Zap Goals
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{goalsLoaded} / {targetGoals}</span>
          <span>•</span>
          <span>{elapsedTime.toFixed(1)}s</span>
        </div>
      </div>

      <Card className="w-full bg-secondary/30 border-secondary">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Relay Connections</span>
            <span className="text-xs text-muted-foreground">
              {connectedRelays} / {totalRelays} connected
            </span>
          </div>

          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {relayStatuses.map((relay) => {
              const relayName = relay.url.replace('wss://', '').split('.')[0];
              return (
                <div
                  key={relay.url}
                  className={cn(
                    "flex items-center gap-2 text-xs py-1 px-2 rounded transition-colors",
                    relay.connected ? "bg-success/10" : "bg-muted/50"
                  )}
                >
                  {relay.connected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="font-medium truncate flex-1">{relayName}</span>
                  <span className="text-muted-foreground">
                    {relay.connected ? 'reading' : 'connecting...'}
                  </span>
                </div>
              );
            })}
          </div>

          {goalsLoaded >= targetGoals && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-success">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ready to display! Finalizing...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
