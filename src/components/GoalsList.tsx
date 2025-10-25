import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { EnrichedGoal } from '@/stores/selectors';

interface GoalsListProps {
  goals: EnrichedGoal[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const GoalsList = memo(({
  goals,
  totalPages,
  currentPage,
  onPageChange,
}: GoalsListProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalCard key={goal.goalId} goal={goal} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => onPageChange(page)}
              className="w-10"
              aria-label={`Page ${page}`}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
});

GoalsList.displayName = 'GoalsList';
