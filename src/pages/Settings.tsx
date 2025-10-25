import { useState } from 'react';
import { Plus, Trash2, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAppSelector, useAppDispatch } from '@/stores/hooks';
import { addRelay, removeRelay, resetToDefaultRelays } from '@/stores/relaysSlice';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const [newRelay, setNewRelay] = useState('');
  const [copiedNpub, setCopiedNpub] = useState(false);
  const dispatch = useAppDispatch();
  const relays = useAppSelector((state) => state.relays.relays);
  const relayStatuses = useAppSelector((state) => state.relays.relayStatuses);
  const npub = useAppSelector((state) => state.auth.npub);

  const handleAddRelay = () => {
    if (!newRelay) return;
    
    if (!newRelay.startsWith('wss://') && !newRelay.startsWith('ws://')) {
      toast({
        title: 'Invalid Relay URL',
        description: 'Relay URL must start with wss:// or ws://',
        variant: 'destructive',
      });
      return;
    }

    if (relays.includes(newRelay)) {
      toast({
        title: 'Duplicate Relay',
        description: 'This relay is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    dispatch(addRelay(newRelay));
    setNewRelay('');
    toast({
      title: 'Relay Added',
      description: 'Refresh the page to connect to the new relay.',
    });
  };

  const handleRemoveRelay = (url: string) => {
    dispatch(removeRelay(url));
    toast({
      title: 'Relay Removed',
      description: 'Refresh the page to disconnect from this relay.',
    });
  };

  const handleCopyNpub = async () => {
    if (!npub) return;
    await navigator.clipboard.writeText(npub);
    setCopiedNpub(true);
    setTimeout(() => setCopiedNpub(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Your npub has been copied to clipboard.',
    });
  };

  const handleResetRelays = () => {
    dispatch(resetToDefaultRelays());
    toast({
      title: 'Relays Reset',
      description: 'Reset to top 10 default relays. Refresh the page to reconnect.',
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your relays and account settings
          </p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your Nostr identity and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Public Key (npub)</Label>
              <div className="flex gap-2">
                <Input value={npub || ''} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyNpub}
                  disabled={!npub}
                >
                  {copiedNpub ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Relay Management */}
        <Card>
          <CardHeader>
            <CardTitle>Relay Management</CardTitle>
            <CardDescription>
              Configure which Nostr relays to connect to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="wss://relay.example.com"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRelay()}
              />
              <Button onClick={handleAddRelay} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Add
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset to Default Relays?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all custom relays and reset to the top 10 default relays. You'll need to refresh the page after resetting.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetRelays}>
                      Reset Relays
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              {relays.map((relay) => {
                const status = relayStatuses.find((r) => r.url === relay);
                const isConnected = status?.connected || false;

                return (
                  <div
                    key={relay}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isConnected ? 'bg-success' : 'bg-destructive'
                        }`}
                      />
                      <span className="font-mono text-sm truncate">{relay}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRelay(relay)}
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              Note: Changes to relays require a page refresh to take effect.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Settings;
