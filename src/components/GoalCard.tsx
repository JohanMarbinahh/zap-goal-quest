import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Goal9041 } from '@/types/nostr';
import { useAppSelector } from '@/stores/hooks';
import { shortNpub } from '@/lib/ndk';
import { formatSats } from '@/lib/nostrHelpers';

interface GoalCardProps {
  goal: Goal9041;
}

export const GoalCard = memo(({ goal }: GoalCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const profile = useAppSelector((state) => state.profiles.profiles[goal.authorPubkey]);
  const zaps = useAppSelector((state) => state.zaps.zapsByGoal[goal.eventId] || []);
  
  // Memoize expensive calculations
  const { raised, progress } = useMemo(() => {
    const totalRaised = zaps.reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
    const progressPercent = Math.min((totalRaised / goal.targetSats) * 100, 100);
    return { raised: totalRaised, progress: progressPercent };
  }, [zaps, goal.targetSats]);

  const handleFund = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile?.lud16) {
      window.open(`lightning:${profile.lud16}`, '_blank');
    }
  };

  const handleCardClick = () => {
    navigate(`/goal/${goal.goalId}`);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const hasSummary = goal.summary && goal.summary.trim().length > 0;

  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 border-border/50 cursor-pointer" 
      onClick={handleCardClick}
    >
      {goal.imageUrl && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={goal.imageUrl}
            alt={goal.title || goal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={profile?.picture} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">
              {goal.title || goal.name || 'Untitled Goal'}
            </h3>
            <p className="text-sm text-muted-foreground">
              by {profile?.displayName || profile?.name || shortNpub(goal.authorPubkey)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasSummary && (
          <div className="space-y-2">
            <div 
              className={`text-sm text-muted-foreground ${!isExpanded ? 'line-clamp-2' : ''}`}
            >
              {goal.summary}
            </div>
            {goal.summary && goal.summary.length > 100 && (
              <button
                onClick={handleExpandClick}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Show more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {formatSats(raised)} / {formatSats(goal.targetSats)} sats
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {progress.toFixed(1)}% funded
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={handleFund}
                  disabled={!profile?.lud16}
                >
                  <Zap className="w-4 h-4" fill="currentColor" />
                  Fund Goal
                </Button>
              </div>
            </TooltipTrigger>
            {!profile?.lud16 && (
              <TooltipContent>
                <p>No Lightning address available for this goal</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
});

GoalCard.displayName = 'GoalCard';
