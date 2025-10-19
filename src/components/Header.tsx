import { Link } from 'react-router-dom';
import { Zap, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { shortNpub } from '@/lib/ndk';
import { RelayStatus } from './RelayStatus';

export const Header = () => {
  const { npub, isNip07 } = useAuthStore();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Zap className="w-6 h-6 text-primary" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            ZapGoal
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <RelayStatus />
          
          {npub && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <div className={`w-2 h-2 rounded-full ${isNip07 ? 'bg-success' : 'bg-accent'}`} />
              <span className="text-sm font-mono text-muted-foreground">
                {shortNpub(npub)}
              </span>
            </div>
          )}

          <Link to="/me">
            <Button variant="ghost" size="icon">
              <User className="w-4 h-4" />
            </Button>
          </Link>

          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
