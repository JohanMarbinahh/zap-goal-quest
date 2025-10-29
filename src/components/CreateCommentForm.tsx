import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getNDK } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { toast } from '@/hooks/use-toast';

/**
 * Form to create a comment on a goal
 * 
 * How it works:
 * 1. User types comment text
 * 2. On submit, creates a Nostr Kind 1 event
 * 3. Tags the goal with ['e', goalEventId, '', 'root']
 * 4. Tags the goal author with ['p', goalAuthorPubkey]
 * 5. Publishes to Nostr relays
 * 6. Comment appears automatically via subscription in useGoalComments
 */

interface CreateCommentFormProps {
  goalEventId: string;
  goalAuthorPubkey: string;
  onCommentPosted?: () => void;
}

export const CreateCommentForm = ({ 
  goalEventId, 
  goalAuthorPubkey,
  onCommentPosted 
}: CreateCommentFormProps) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!content.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please write a comment',
        variant: 'destructive',
      });
      return;
    }

    // Enforce character limit
    if (content.length > 500) {
      toast({
        title: 'Comment too long',
        description: 'Please keep comments under 500 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsPosting(true);
    try {
      const ndk = getNDK();
      
      // Create Nostr event
      const event = new NDKEvent(ndk);
      event.kind = 1; // Kind 1 = text note (comment)
      event.content = content;
      
      // Add tags to create relationships
      event.tags = [
        ['e', goalEventId, '', 'root'],  // Links to goal (root = top-level comment)
        ['p', goalAuthorPubkey],         // Tags goal author (for notifications)
      ];
      
      // Publish to relays
      await event.publish();
      
      toast({
        title: 'Comment posted! 🎉',
        description: 'Your comment has been published',
      });
      
      // Clear form
      setContent('');
      onCommentPosted?.();
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast({
        title: 'Failed to post',
        description: 'Could not publish your comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
      <Textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={isPosting}
        className="resize-none"
        maxLength={500}
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {content.length}/500 characters
        </p>
        <Button 
          type="submit" 
          disabled={isPosting || !content.trim()}
        >
          {isPosting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
};
