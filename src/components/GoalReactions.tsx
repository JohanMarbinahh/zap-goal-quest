import { Card, CardContent } from '@/components/ui/card';
import { useAppSelector } from '@/stores/hooks';
import { Reaction7 } from '@/types/nostr';

interface GoalReactionsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const GoalReactions = ({ goalEventId, goalAuthorPubkey }: GoalReactionsProps) => {
  const reactions = useAppSelector((state) => 
    state.reactions.reactionsByGoal[goalEventId] || []
  );

  // Count by type
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.content] = (acc[r.content] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all unique emojis with counts
  const allEmojis = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* All unique emojis section */}
        {allEmojis.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allEmojis.map(([emoji, count]) => (
              <div
                key={emoji}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
              >
                <span className="text-lg">{emoji}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
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
