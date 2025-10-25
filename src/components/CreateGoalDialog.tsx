import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getNDK, publishEvent } from '@/lib/ndk';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { parseGoal9041 } from '@/lib/nostrHelpers';

// Input validation schema
const goalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  targetSats: z.number().positive('Target must be a positive number').int('Target must be a whole number'),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().trim().max(5000, 'Description must be less than 5000 characters').optional(),
  status: z.enum(['active', 'paused', 'done']),
});

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateGoalDialog = ({ open, onOpenChange }: CreateGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [targetSats, setTargetSats] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const userPubkey = useAppSelector((state) => state.auth.pubkey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is logged in
      if (!userPubkey) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to create a goal.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const ndk = getNDK();
      
      // Check if NDK has a signer
      if (!ndk.signer) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in with your Nostr key to create goals.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const goalId = uuidv4();
      const target = parseInt(targetSats, 10);

      // Validate inputs
      const validationResult = goalSchema.safeParse({
        title,
        targetSats: target,
        imageUrl: imageUrl || '',
        description: description || '',
        status,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        setIsLoading(false);
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
      
      // Add description as custom tag if provided
      if (description.trim()) {
        event.tags.push(['description', description.trim()]);
      }

      const publishedEvent = await publishEvent(event);

      const goal = parseGoal9041(publishedEvent);
      if (goal) {
        dispatch(setGoal({ goalId: goal.goalId, goal }));
      }

      toast({
        title: 'Goal Created!',
        description: 'Your fundraising goal has been published to Nostr.',
      });

      // Reset form
      setTitle('');
      setTargetSats('');
      setImageUrl('');
      setDescription('');
      setStatus('active');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
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
              <Label htmlFor="description">Detailed Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add more detailed information about your goal, what you're raising funds for, how you'll use the funds, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={5000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/5000 characters
              </p>
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
