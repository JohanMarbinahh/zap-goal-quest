import { Card, CardContent } from '@/components/ui/card';
import { useGoalReactions } from '@/hooks/useGoalReactions';
import { Reaction7 } from '@/types/nostr';

interface GoalReactionsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const GoalReactions = ({ goalEventId, goalAuthorPubkey }: GoalReactionsProps) => {
  const reactions = useGoalReactions(goalEventId);

  // Count reactions by emoji/content
  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.content] = (acc[r.content] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all unique reactions sorted by count
  const allReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1]);

  // Helper to display emoji or convert +/- to emoji
  const getDisplayEmoji = (content: string) => {
    if (content === '+') return '👍';
    if (content === '-') return '👎';
    if (content === '') return '👍';
    return content;
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {allReactions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allReactions.map(([content, count]) => (
              <div
                key={content}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
              >
                <span className="text-lg">{getDisplayEmoji(content)}</span>
                <span className="font-medium">{count}x</span>
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
