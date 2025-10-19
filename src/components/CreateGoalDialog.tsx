import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getNDK, publishEvent } from '@/lib/ndk';
import { useAppDispatch } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { parseGoal9041 } from '@/lib/nostrHelpers';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGoalDialog = ({ open, onOpenChange }: CreateGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [targetSats, setTargetSats] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const ndk = getNDK();
      const goalId = uuidv4();
      const target = parseInt(targetSats, 10);

      if (!title || isNaN(target) || target <= 0) {
        return;
      }

      const content = JSON.stringify({
        title,
        image: imageUrl || undefined,
        status,
      });

      const event = new NDKEvent(ndk);
      event.kind = 9041;
      event.content = content;
      event.tags = [
        ['d', goalId],
        ['goal', 'sats', target.toString()],
        ['amount', target.toString()],
        ['unit', 'sat'],
      ];

      const publishedEvent = await publishEvent(event);

      const goal = parseGoal9041(publishedEvent);
      if (goal) {
        dispatch(setGoal({ goalId: goal.goalId, goal }));
      }

      // Reset form
      setTitle('');
      setTargetSats('');
      setImageUrl('');
      setStatus('active');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Fundraising Goal</DialogTitle>
            <DialogDescription>
              Publish a new Zap Goal (kind 9041) to raise sats for your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="My Amazing Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target (sats) *</Label>
              <Input
                id="target"
                type="number"
                placeholder="100000"
                value={targetSats}
                onChange={(e) => setTargetSats(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Publishing...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
