import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getNDK } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useAppSelector, useAppDispatch } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { parseGoal9041 } from '@/lib/nostrHelpers';
import { Goal9041 } from '@/types/nostr';

interface EditGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal9041;
}

export function EditGoalDialog({ open, onOpenChange, goal }: EditGoalDialogProps) {
  const [title, setTitle] = useState(goal.title || '');
  const [targetSats, setTargetSats] = useState(goal.targetSats.toString());
  const [imageUrl, setImageUrl] = useState(goal.imageUrl || '');
  const [description, setDescription] = useState(goal.summary || '');
  const [status, setStatus] = useState(goal.status || 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useAppDispatch();
  const userPubkey = useAppSelector((state) => state.auth.pubkey);

  const generateChangelog = (oldGoal: Goal9041, newData: any): string => {
    const changes: string[] = [];
    
    if (newData.title !== oldGoal.title) {
      changes.push(`Title changed from "${oldGoal.title}" to "${newData.title}"`);
    }
    if (parseInt(newData.targetSats) !== oldGoal.targetSats) {
      changes.push(`Target changed from ${oldGoal.targetSats.toLocaleString()} to ${parseInt(newData.targetSats).toLocaleString()} sats`);
    }
    if (newData.description !== oldGoal.summary) {
      changes.push('Description updated');
    }
    if (newData.imageUrl !== oldGoal.imageUrl) {
      changes.push('Image updated');
    }
    if (newData.status !== oldGoal.status) {
      changes.push(`Status changed from ${oldGoal.status} to ${newData.status}`);
    }

    return changes.length > 0 
      ? `Goal updated: ${changes.join(', ')}`
      : 'Goal updated';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userPubkey) {
      toast.error('You must be logged in to edit a goal');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const targetAmount = parseInt(targetSats);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('Target amount must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      const ndk = getNDK();
      
      // Create updated goal event with same goalId
      const event = new NDKEvent(ndk);
      event.kind = 9041;
      event.content = JSON.stringify({
        title: title.trim(),
        summary: description.trim(),
        image: imageUrl.trim(),
        status: status,
      });
      
      // Use same goalId (d tag) to make it replaceable
      event.tags = [
        ['d', goal.goalId],
        ['amount', (targetAmount * 1000).toString()], // Convert to msats
        ['updated_from', goal.eventId], // Track previous version
      ];

      if (imageUrl.trim()) {
        event.tags.push(['image', imageUrl.trim()]);
      }

      if (description.trim()) {
        event.tags.push(['description', description.trim()]);
      }

      if (status === 'closed') {
        event.tags.push(['closed_at', Math.floor(Date.now() / 1000).toString()]);
      }

      await event.publish();

      // Parse and dispatch the updated goal
      const updatedGoal = parseGoal9041(event);
      if (updatedGoal) {
        dispatch(setGoal({ goalId: updatedGoal.goalId, goal: updatedGoal }));
      }

      // Create automatic update comment
      const changelog = generateChangelog(goal, { 
        title: title.trim(), 
        targetSats: targetAmount, 
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        status 
      });

      const updateEvent = new NDKEvent(ndk);
      updateEvent.kind = 1;
      updateEvent.content = changelog;
      updateEvent.tags = [
        ['e', event.id], // Reference the new goal event
        ['p', goal.authorPubkey],
      ];

      await updateEvent.publish();

      toast.success('Goal updated successfully!');
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setTargetSats('');
      setImageUrl('');
      setDescription('');
      setStatus('active');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>
            Update your fundraising goal. Changes will be published to the Nostr network.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fund my new project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetSats">Target Amount (sats) *</Label>
            <Input
              id="targetSats"
              type="number"
              value={targetSats}
              onChange={(e) => setTargetSats(e.target.value)}
              placeholder="e.g., 100000"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your fundraising goal..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
