import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getNDK } from '@/lib/ndk';
import { toast } from '@/hooks/use-toast';
import { NDKEvent } from '@nostr-dev-kit/ndk';

interface CreateUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalEventId: string;
  goalAuthorPubkey: string;
}

export const CreateUpdateDialog = ({ open, onOpenChange, goalEventId, goalAuthorPubkey }: CreateUpdateDialogProps) => {
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write an update message',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const ndk = getNDK();
      const event = new NDKEvent(ndk);
      event.kind = 1;
      event.content = content;
      event.tags = [
        ['e', goalEventId, '', 'root'],
        ['p', goalAuthorPubkey],
      ];
      
      await event.publish();
      
      toast({
        title: 'Update published!',
        description: 'Your update has been shared',
      });
      
      setContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to publish update:', error);
      toast({
        title: 'Failed to publish',
        description: 'Could not publish your update',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post Goal Update</DialogTitle>
          <DialogDescription>
            Share progress, milestones, or news about your goal with supporters
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="update-content">Update Message</Label>
            <Textarea
              id="update-content"
              placeholder="Share your progress or news..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing || !content.trim()}>
            {isPublishing ? 'Publishing...' : 'Publish Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
