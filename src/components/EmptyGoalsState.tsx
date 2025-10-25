import { memo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyGoalsStateProps {
  variant: 'no-goals' | 'no-results';
  onCreateGoal?: () => void;
  onClearFilters?: () => void;
}

export const EmptyGoalsState = memo(({
  variant,
  onCreateGoal,
  onClearFilters,
}: EmptyGoalsStateProps) => {
  if (variant === 'no-results') {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-semibold mb-2">No goals found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your filters to see more results
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <div className="inline-flex p-6 rounded-full bg-primary/10 mb-4">
        <Plus className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">No goals yet</h3>
      <p className="text-muted-foreground mb-6">
        Be the first to create a fundraising goal!
      </p>
      <Button onClick={onCreateGoal} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Your First Goal
      </Button>
    </div>
  );
});

EmptyGoalsState.displayName = 'EmptyGoalsState';
