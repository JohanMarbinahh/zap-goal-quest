import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import { Reaction7 } from '@/types/nostr';
import { getNDK } from '@/lib/ndk';
import { toast } from '@/hooks/use-toast';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

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

  const handleReact = async (emojiData: EmojiClickData | string) => {
    if (!userPubkey) {
      toast({
        title: 'Login required',
        description: 'You must be logged in to react',
        variant: 'destructive',
      });
      return;
    }

    const emoji = typeof emojiData === 'string' ? emojiData : emojiData.emoji;

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

  // Get all unique emojis with counts
  const allEmojis = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Emoji picker trigger */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Smile className="w-4 h-4" />
                Add Reaction
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-0" align="start">
              <EmojiPicker onEmojiClick={handleReact} />
            </PopoverContent>
          </Popover>
        </div>
        {/* All unique emojis section */}
        {allEmojis.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allEmojis.map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors text-sm"
              >
                <span className="text-lg">{emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reactions yet. Be the first to react!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
