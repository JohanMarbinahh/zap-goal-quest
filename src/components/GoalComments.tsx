import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector } from '@/stores/hooks';
import { shortNpub } from '@/lib/ndk';
import { formatRelativeTime } from '@/lib/nostrHelpers';

interface GoalCommentsProps {
  goalEventId: string;
  goalAuthorPubkey: string;
}

export function GoalComments({ goalEventId }: GoalCommentsProps) {
  const comments = useAppSelector((state) => 
    state.comments.commentsByGoal[goalEventId] || []
  );
  const allProfiles = useAppSelector((state) => state.profiles.profiles);

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
              <p>No comments yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
