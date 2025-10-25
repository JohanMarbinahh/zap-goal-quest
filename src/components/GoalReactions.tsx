import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useGoalReactions } from '@/hooks/useGoalReactions';
import { Reaction7 } from '@/types/nostr';

interface GoalReactionsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const GoalReactions = ({ goalEventId, goalAuthorPubkey }: GoalReactionsProps) => {
  const reactions = useGoalReactions(goalEventId);

  // Count likes and dislikes
  const likeCount = reactions.filter(r => r.content === '+' || r.content === '').length;
  const dislikeCount = reactions.filter(r => r.content === '-').length;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {reactions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {likeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-medium">{likeCount}</span>
              </div>
            )}
            {dislikeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
                <ThumbsDown className="w-4 h-4" />
                <span className="font-medium">{dislikeCount}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reactions yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
