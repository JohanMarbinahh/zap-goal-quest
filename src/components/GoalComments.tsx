import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/stores/hooks';
import { shortNpub } from '@/lib/ndk';
import { formatRelativeTime } from '@/lib/nostrHelpers';
import { getNDK } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { toast } from '@/hooks/use-toast';

interface GoalCommentsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export function GoalComments({ goalEventId }: GoalCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const comments = useAppSelector((state) => 
    state.comments.commentsByGoal[goalEventId] || []
  );
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  const allProfiles = useAppSelector((state) => state.profiles.profiles);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !userPubkey) return;

    setIsSubmitting(true);
    try {
      const ndk = getNDK();
      const event = new NDKEvent(ndk);
      event.kind = 1;
      event.content = commentText.trim();
      event.tags = [
        ['e', goalEventId], // Reference the goal
      ];

      await event.publish();
      
      toast({
        title: 'Comment posted!',
        description: 'Your comment has been published.',
      });
      
      setCommentText('');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast({
        title: 'Failed to post',
        description: 'Could not publish your comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedComments = [...comments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        {userPubkey && (
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        )}

        {!userPubkey && (
          <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg bg-muted/30">
            Login to post comments
          </div>
        )}

        {/* Comments Feed */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sortedComments.map((comment) => {
            const authorProfile = allProfiles[comment.authorPubkey];
            
            return (
              <div
                key={comment.eventId}
                className="flex gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={authorProfile?.picture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {authorProfile?.name?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {authorProfile?.displayName ||
                        authorProfile?.name ||
                        shortNpub(comment.authorPubkey)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
          
          {comments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
