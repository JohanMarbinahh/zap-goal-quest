import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';
import { loginWithPrivateKey, loginWithNip07 } from '@/lib/ndk';

export default function Login() {
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePrivateKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your private key',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await loginWithPrivateKey(privateKey.trim());
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Invalid private key',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNip07Login = async () => {
    setLoading(true);
    try {
      await loginWithNip07();
      toast({
        title: 'Success',
        description: 'Logged in with browser extension',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Browser extension not found',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Zap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to ZapGoal</CardTitle>
          <CardDescription>Sign in to your Nostr account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePrivateKeyLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key (nsec)</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="nsec1..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your Nostr private key starting with nsec or hex format
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in with Private Key'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleNip07Login}
            disabled={loading}
          >
            Sign in with Browser Extension
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Don't have a Nostr key? Get a browser extension like{' '}
            <a
              href="https://getalby.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Alby
            </a>{' '}
            or{' '}
            <a
              href="https://github.com/fiatjaf/nos2x"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              nos2x
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
