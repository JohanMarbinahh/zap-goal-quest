import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalReactions } from '@/hooks/useGoalReactions';
import { Reaction7 } from '@/types/nostr';
import { isUpvote, isDownvote, isEmojiReaction } from '@/lib/reactionHelpers';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface GoalReactionsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const GoalReactions = ({ goalEventId, goalAuthorPubkey }: GoalReactionsProps) => {
  const reactions = useGoalReactions(goalEventId);

  // Separate votes from emoji reactions
  const upvotes = reactions.filter(r => isUpvote(r.content));
  const downvotes = reactions.filter(r => isDownvote(r.content));
  const emojiReactions = reactions.filter(r => isEmojiReaction(r.content));

  // Count emoji reactions by type
  const emojiCounts = emojiReactions.reduce((acc, r) => {
    acc[r.content] = (acc[r.content] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get all unique emojis with counts, sorted by count descending
  const sortedEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      {/* Votes Section */}
      <CardHeader>
        <CardTitle className="text-lg">Votes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <ThumbsUp className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">{upvotes.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <ThumbsDown className="w-5 h-5 text-destructive" />
            <span className="font-semibold text-lg">{downvotes.length}</span>
          </div>
        </div>

        {/* Emoji Reactions Section */}
        {sortedEmojis.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Emoji Reactions</h3>
            <div className="flex flex-wrap gap-2">
              {sortedEmojis.map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No reactions yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
