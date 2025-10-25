import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Calendar, Target, Hash, Info, Copy, Check } from 'lucide-react';
import { GoalComments } from '@/components/GoalComments';
import { GoalReactions } from '@/components/GoalReactions';
import { GoalUpdates } from '@/components/GoalUpdates';
import { CreateUpdateDialog } from '@/components/CreateUpdateDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppSelector, useAppDispatch } from '@/stores/hooks';
import { setProfile } from '@/stores/profilesSlice';
import { addComment, addMockComments, mockCommentProfiles } from '@/stores/commentsSlice';
import { addMockReactions, mockProfiles } from '@/stores/reactionsSlice';
import { shortNpub, getNDK } from '@/lib/ndk';
import { formatSats, formatRelativeTime, parseComment } from '@/lib/nostrHelpers';
import { toast } from '@/hooks/use-toast';
import { NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

const GoalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [excludeSelfZaps, setExcludeSelfZaps] = useState(true);
  const [copiedPubkey, setCopiedPubkey] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  
  const goal = useAppSelector((state) => id ? state.goals.goals[id] : undefined);
  const profile = useAppSelector((state) => 
    goal ? state.profiles.profiles[goal.authorPubkey] : undefined
  );
  const zaps = useAppSelector((state) => 
    goal ? (state.zaps.zapsByGoal[goal.eventId] || []) : []
  );
  
  // Add mock data on mount
  useEffect(() => {
    if (goal?.eventId) {
      // Add mock reactions
      dispatch(addMockReactions(goal.eventId));
      Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
        dispatch(setProfile({ pubkey, profile }));
      });
      
      // Add mock comments
      dispatch(addMockComments(goal.eventId));
      mockCommentProfiles.forEach(profile => {
        dispatch(setProfile({ pubkey: profile.pubkey, profile }));
      });
    }
  }, [goal?.eventId, dispatch]);
  
  // Subscribe to comments for this goal
  useEffect(() => {
    if (!goal?.eventId) return;
    
    let commentSub: NDKSubscription | null = null;
    
    const subscribeToComments = async () => {
      try {
        const ndk = getNDK();
        const commentFilter: NDKFilter = {
          kinds: [1],
          '#e': [goal.eventId],
          limit: 100,
        };
        
        commentSub = ndk.subscribe(commentFilter, { closeOnEose: false });
        
        commentSub.on('event', (event) => {
          const comment = parseComment(event);
          if (comment) {
            dispatch(addComment(comment));
            
            // Subscribe to commenter profile
            const profileFilter: NDKFilter = {
              kinds: [0],
              authors: [comment.authorPubkey],
            };
            const profileSub = ndk.subscribe(profileFilter, { closeOnEose: true });
            profileSub.on('event', (profileEvent) => {
              try {
                const profile = JSON.parse(profileEvent.content);
                dispatch(setProfile({ 
                  pubkey: profileEvent.pubkey, 
                  profile: { pubkey: profileEvent.pubkey, ...profile } 
                }));
              } catch (error) {
                console.error('Failed to parse profile:', error);
              }
            });
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to comments:', error);
      }
    };
    
    subscribeToComments();
    
    return () => {
      commentSub?.stop();
    };
  }, [goal?.eventId, dispatch]);
  
  // Calculate raised amount
  const filteredZaps = excludeSelfZaps && goal
    ? zaps.filter(z => z.zapperPubkey !== goal.authorPubkey)
    : zaps;
  const raised = filteredZaps.reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
  
  // Calculate top supporters
  const supportersMap = new Map<string, { pubkey: string; total: number; count: number }>();
  filteredZaps.forEach((zap) => {
    if (!zap.zapperPubkey) return;
    const existing = supportersMap.get(zap.zapperPubkey);
    const amount = Math.floor(zap.amountMsat / 1000);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      supportersMap.set(zap.zapperPubkey, { pubkey: zap.zapperPubkey, total: amount, count: 1 });
    }
  });
  const topSupporters = Array.from(supportersMap.values()).sort((a, b) => b.total - a.total);
  
  const progress = goal ? Math.min((raised / goal.targetSats) * 100, 100) : 0;

  if (!goal) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-2">Goal not found</h2>
          <p className="text-muted-foreground mb-6">
            This goal may not exist or hasn't been loaded yet.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  const handleFund = () => {
    if (profile?.lud16) {
      window.open(`lightning:${profile.lud16}`, '_blank');
    }
  };

  const handleCopyPubkey = async () => {
    if (!goal?.authorPubkey) return;
    
    try {
      await navigator.clipboard.writeText(goal.authorPubkey);
      setCopiedPubkey(true);
      toast({
        title: 'Copied!',
        description: 'Public key copied to clipboard',
      });
      setTimeout(() => setCopiedPubkey(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy public key',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back to Goals
        </Button>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">
            {goal.title || goal.name || 'Untitled Goal'}
          </h1>
          {goal.summary && (
            <p className="text-lg text-muted-foreground mt-4 max-w-4xl">
              {goal.summary}
            </p>
          )}
        </div>

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
            
            {/* Author Card */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={profile?.picture} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.name?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {profile?.displayName || profile?.name || shortNpub(goal.authorPubkey)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleCopyPubkey}
                      >
                        {copiedPubkey ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {profile?.about && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{profile.about}</p>
                  {profile.lud16 && (
                    <p className="text-xs text-muted-foreground mt-2">⚡ {profile.lud16}</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Goal Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Goal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {formatRelativeTime(goal.createdAt)}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Target Amount</p>
                    <p className="text-sm font-medium">
                      {formatSats(goal.targetSats)} sats
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Goal ID</p>
                    <p className="text-sm font-mono break-all">
                      {goal.goalId}
                    </p>
                  </div>
                </div>
                
                {goal.status && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            {/* Progress Card */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
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
              </CardContent>
            </Card>

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
          {/* Left Column: Comments, Reactions & Updates */}
          <div className="md:col-span-2 space-y-6">
            <GoalComments goalEventId={goal.eventId} goalAuthorPubkey={goal.authorPubkey} />
            <GoalReactions goalEventId={goal.eventId} goalAuthorPubkey={goal.authorPubkey} />
            <GoalUpdates 
              goalEventId={goal.eventId} 
              onCreateUpdate={() => setIsUpdateDialogOpen(true)}
              isGoalAuthor={userPubkey === goal.authorPubkey}
            />
          </div>

          {/* Right Column: Top Supporters & Zaps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Supporters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSupporters.slice(0, 10).map((supporter, index) => {
                    const supporterProfile = useAppSelector((state) => 
                      state.profiles.profiles[supporter.pubkey]
                    );
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

            {/* Zaps Feed */}
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
                  {filteredZaps
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((zap) => {
                      const zapperProfile = useAppSelector((state) => 
                        zap.zapperPubkey ? state.profiles.profiles[zap.zapperPubkey] : null
                      );
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
          </div>
        </div>
      </div>
      
      <CreateUpdateDialog 
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        goalEventId={goal.eventId}
        goalAuthorPubkey={goal.authorPubkey}
      />
    </main>
  );
};

export default GoalDetail;
