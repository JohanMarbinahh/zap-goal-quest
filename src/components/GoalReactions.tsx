import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, Heart, Flame } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import { Reaction7 } from '@/types/nostr';
import { shortNpub } from '@/lib/ndk';
import { formatRelativeTime } from '@/lib/nostrHelpers';
import { getNDK } from '@/lib/ndk';
import { toast } from '@/hooks/use-toast';
import { NDKEvent } from '@nostr-dev-kit/ndk';

interface GoalReactionsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const GoalReactions = ({ goalEventId, goalAuthorPubkey }: GoalReactionsProps) => {
  const reactions = useAppSelector((state) => 
    state.reactions.reactionsByGoal[goalEventId] || []
  );
  const userPubkey = useAppSelector((state) => state.auth.pubkey);

  // Categorize reactions
  const positiveReactions = reactions.filter(r => ['+', '❤️', '🔥', '👍'].includes(r.content));
  const negativeReactions = reactions.filter(r => ['-', '👎'].includes(r.content));

  // Count by type
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.content] = (acc[r.content] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleReact = async (emoji: string) => {
    if (!userPubkey) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to react',
        variant: 'destructive',
      });
      return;
    }

    try {
      const ndk = getNDK();
      const event = new NDKEvent(ndk);
      event.kind = 7;
      event.content = emoji;
      event.tags = [
        ['e', goalEventId],
        ['p', goalAuthorPubkey],
      ];
      
      await event.publish();
      
      toast({
        title: 'Reaction sent!',
        description: 'Your reaction has been published',
      });
    } catch (error) {
      console.error('Failed to publish reaction:', error);
      toast({
        title: 'Failed to react',
        description: 'Could not publish your reaction',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reactions ({reactions.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReact('❤️')}
              className="gap-1"
            >
              <Heart className="w-4 h-4" />
              {reactionCounts['❤️'] || 0}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReact('🔥')}
              className="gap-1"
            >
              <Flame className="w-4 h-4" />
              {reactionCounts['🔥'] || 0}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReact('+')}
              className="gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              {reactionCounts['+'] || 0}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReact('-')}
              className="gap-1"
            >
              <ThumbsDown className="w-4 h-4" />
              {reactionCounts['-'] || 0}
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm mt-2">
          <Badge variant="default" className="gap-1">
            <ThumbsUp className="w-3 h-3" />
            {positiveReactions.length} Positive
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <ThumbsDown className="w-3 h-3" />
            {negativeReactions.length} Negative
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {reactions
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((reaction) => {
              const reactorProfile = useAppSelector((state) => 
                state.profiles.profiles[reaction.reactorPubkey]
              );
              return (
                <div
                  key={reaction.eventId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={reactorProfile?.picture} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {reactorProfile?.name?.[0]?.toUpperCase() || 'R'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {reactorProfile?.displayName ||
                          reactorProfile?.name ||
                          shortNpub(reaction.reactorPubkey)}
                      </span>
                      <span className="text-2xl">{reaction.content}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(reaction.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          {reactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reactions yet. Be the first to react!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
