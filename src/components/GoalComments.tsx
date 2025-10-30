import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector } from '@/stores/hooks';
import { useGoalComments } from '@/hooks/useGoalComments';
import { shortNpub } from '@/lib/ndk';
import { formatRelativeTime } from '@/lib/nostrHelpers';
import { CreateCommentForm } from './CreateCommentForm';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GoalCommentsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export function GoalComments({ goalEventId, goalAuthorPubkey }: GoalCommentsProps) {
  const comments = useGoalComments(goalEventId);
  const allProfiles = useAppSelector((state) => state.profiles.profiles);
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  const isLoggedIn = !!userPubkey;

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
        {isLoggedIn ? (
          <CreateCommentForm goalEventId={goalEventId} goalAuthorPubkey={goalAuthorPubkey} />
        ) : (
          <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
            Log in to post comments
          </div>
        )}

        {/* Comments Feed */}
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
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
              <p>No comments yet. {isLoggedIn ? 'Be the first!' : 'Log in to comment!'}</p>
            </div>
          )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
