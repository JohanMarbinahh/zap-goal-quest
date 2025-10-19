import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Zap, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoalsStore } from '@/stores/goalsStore';
import { useProfilesStore } from '@/stores/profilesStore';
import { useZapsStore } from '@/stores/zapsStore';
import { shortNpub } from '@/lib/ndk';
import { formatSats, formatRelativeTime } from '@/lib/nostrHelpers';
import { ZapTimeline } from '@/components/ZapTimeline';

const GoalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [excludeSelfZaps, setExcludeSelfZaps] = useState(true);
  
  const { getGoal } = useGoalsStore();
  const { getProfile } = useProfilesStore();
  const { getZapsForGoal, getRaisedForGoal, getTopSupporters } = useZapsStore();

  const goal = id ? getGoal(id) : undefined;
  const profile = goal ? getProfile(goal.authorPubkey) : undefined;
  const zaps = goal ? getZapsForGoal(goal.eventId) : [];
  const raised = goal ? getRaisedForGoal(goal.eventId, excludeSelfZaps, goal.authorPubkey) : 0;
  const topSupporters = goal ? getTopSupporters(goal.eventId, excludeSelfZaps, goal.authorPubkey) : [];
  
  const progress = goal ? Math.min((raised / goal.targetSats) * 100, 100) : 0;

  if (!goal) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-2">Goal not found</h2>
          <p className="text-muted-foreground mb-6">
            This goal may not exist or hasn't been loaded yet.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const handleFund = () => {
    if (profile?.lud16) {
      window.open(`lightning:${profile.lud16}`, '_blank');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Goals
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            {goal.imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={goal.imageUrl}
                  alt={goal.title || goal.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                <AvatarImage src={profile?.picture} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.name?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold">
                  {profile?.displayName || profile?.name || shortNpub(goal.authorPubkey)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">
              {goal.title || goal.name || 'Untitled Goal'}
            </h1>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-bold text-primary">
                  {formatSats(raised)} sats
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Goal: {formatSats(goal.targetSats)} sats
                </span>
                <span className="font-semibold">{progress.toFixed(1)}%</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gap-2 text-lg"
              onClick={handleFund}
              disabled={!profile?.lud16}
            >
              <Zap className="w-5 h-5" fill="currentColor" />
              Fund This Goal
            </Button>

            {!profile?.lud16 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Creator hasn't set up Lightning address yet
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Zaps Feed */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Zaps ({zaps.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="self-zaps"
                      checked={excludeSelfZaps}
                      onCheckedChange={setExcludeSelfZaps}
                    />
                    <Label htmlFor="self-zaps" className="text-sm">
                      Hide self-zaps
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {zaps
                    .filter((z) => !excludeSelfZaps || z.zapperPubkey !== goal.authorPubkey)
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((zap) => {
                      const zapperProfile = zap.zapperPubkey ? getProfile(zap.zapperPubkey) : null;
                      return (
                        <div
                          key={zap.eventId}
                          className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={zapperProfile?.picture} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {zapperProfile?.name?.[0]?.toUpperCase() || 'Z'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {zapperProfile?.displayName ||
                                  zapperProfile?.name ||
                                  (zap.zapperPubkey ? shortNpub(zap.zapperPubkey) : 'Anonymous')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(zap.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-accent">
                                {formatSats(zap.amountMsat / 1000)} sats
                              </span>
                              {zap.memo && (
                                <span className="text-sm text-muted-foreground">
                                  • {zap.memo}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  {zaps.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No zaps yet. Be the first to support this goal!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <ZapTimeline zaps={zaps} />
          </div>

          {/* Top Supporters */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Top Supporters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSupporters.slice(0, 10).map((supporter, index) => {
                    const supporterProfile = getProfile(supporter.pubkey);
                    return (
                      <div
                        key={supporter.pubkey}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={supporterProfile?.picture} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {supporterProfile?.name?.[0]?.toUpperCase() || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {supporterProfile?.displayName ||
                              supporterProfile?.name ||
                              shortNpub(supporter.pubkey)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {supporter.count} zap{supporter.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-sm font-bold text-accent">
                          {formatSats(supporter.total)}
                        </div>
                      </div>
                    );
                  })}
                  {topSupporters.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No supporters yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default GoalDetail;
