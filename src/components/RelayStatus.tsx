import { Wifi, WifiOff } from 'lucide-react';
import { useRelaysStore } from '@/stores/relaysStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const RelayStatus = () => {
  const { relayStatuses } = useRelaysStore();

  const connectedCount = relayStatuses.filter((r) => r.connected).length;
  const totalCount = relayStatuses.length;
  const isConnected = connectedCount > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border cursor-pointer">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium">
              {connectedCount}/{totalCount}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Relay Connections</p>
            {relayStatuses.map((relay) => (
              <div key={relay.url} className="flex items-center gap-2 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    relay.connected ? 'bg-success' : 'bg-destructive'
                  }`}
                />
                <span className="font-mono">{new URL(relay.url).hostname}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
