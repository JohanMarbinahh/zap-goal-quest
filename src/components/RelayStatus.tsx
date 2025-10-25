import { Wifi, WifiOff } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const RelayStatus = () => {
  const relayStatuses = useAppSelector((state) => state.relays.relayStatuses);
  const configuredRelays = useAppSelector((state) => state.relays.relays);

  // Only count statuses for configured relays
  const connectedCount = configuredRelays.filter((relayUrl) => {
    const status = relayStatuses.find((r) => r.url === relayUrl);
    return status?.connected || false;
  }).length;
  const totalCount = configuredRelays.length;
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
            {configuredRelays.map((relayUrl) => {
              const status = relayStatuses.find((r) => r.url === relayUrl);
              const isConnected = status?.connected || false;
              return (
                <div key={relayUrl} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}
                  />
                  <span className="font-mono">{new URL(relayUrl).hostname}</span>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>)
};
