import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { useAppSelector } from '@/stores/hooks';
import { useGoalUpdates } from '@/hooks/useGoalUpdates';
import { shortNpub } from '@/lib/ndk';
import { formatRelativeTime } from '@/lib/nostrHelpers';
import { ScrollArea } from '@/components/ui/scroll-area';


interface GoalUpdatesProps {
  goalEventId: string;
  onCreateUpdate?: () => void;
  isGoalAuthor: boolean;
}

export const GoalUpdates = ({ goalEventId, onCreateUpdate, isGoalAuthor }: GoalUpdatesProps) => {
  const authorPubkey = useAppSelector((state) => {
    const goal = Object.values(state.goals.goals).find(g => g.eventId === goalEventId);
    return goal?.authorPubkey || '';
  });

  console.log("hello")
  const updates = useGoalUpdates(goalEventId, authorPubkey);
  const profiles = useAppSelector((state) => state.profiles.profiles);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Updates ({updates.length})</CardTitle>
          {isGoalAuthor && (
            <Button size="sm" onClick={onCreateUpdate} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Post Update
            </Button>
          )}
        </div>
      </CardHeader>
      <ScrollArea className="h-[400px] pr-2">

        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {updates
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((update) => {
                const authorProfile = profiles[update.authorPubkey];
                return (
                  <div
                    key={update.eventId}
                    className="p-4 rounded-lg bg-secondary/50 border border-border/50"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={authorProfile?.picture} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {authorProfile?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {authorProfile?.displayName ||
                              authorProfile?.name ||
                              shortNpub(update.authorPubkey)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(update.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{update.content}</div>
                  </div>
                );
              })}
            {updates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No updates yet. {isGoalAuthor ? 'Post the first update!' : 'Check back later.'}
              </div>
            )}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
