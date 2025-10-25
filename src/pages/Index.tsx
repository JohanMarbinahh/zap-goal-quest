import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { RelayLoadingStatus } from '@/components/RelayLoadingStatus';
import { GoalsFilter, FilterType, SortType, SortDirection } from '@/components/GoalsFilter';
import { GoalsList } from '@/components/GoalsList';
import { EmptyGoalsState } from '@/components/EmptyGoalsState';
import { useAppSelector } from '@/stores/hooks';
import { selectEnrichedGoals } from '@/stores/selectors';
import { useGoalsSubscription } from '@/hooks/useGoalsSubscription';
import { useGoalsDisplay } from '@/hooks/useGoalsDisplay';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const allGoals = useAppSelector(selectEnrichedGoals);
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  const followingList = useAppSelector((state) =>
    userPubkey ? state.contacts.following[userPubkey] || [] : []
  );

  const {
    initialLoading,
    backgroundLoading,
    goalsLoadedCount,
    displayedTotalCount,
    frozenGoals,
  } = useGoalsSubscription(allGoals, userPubkey);

  const { totalPages, goals, filteredGoalsCount } = useGoalsDisplay(
    allGoals,
    frozenGoals,
    currentPage,
    filter,
    sort,
    sortDirection,
    followingList
  );

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, totalPages, setSearchParams]);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setSearchParams({ page: '1' });
  }, [setSearchParams]);

  const handleSortChange = useCallback((newSort: SortType) => {
    setSort(newSort);
    setSearchParams({ page: '1' });
  }, [setSearchParams]);

  const handleSortDirectionChange = useCallback((newDirection: SortDirection) => {
    setSortDirection(newDirection);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilter('all');
    setSort('date');
    setSortDirection('desc');
    setSearchParams({ page: '1' });
  }, [setSearchParams]);

  if (initialLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <RelayLoadingStatus goalsLoaded={goalsLoadedCount} />
        </div>
      </main>
    );
  }

  const hasGoals = frozenGoals.length > 0 || allGoals.length > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent leading-tight pb-1">
              Fundraising Goals
            </h1>
            <p className="text-muted-foreground">
              Support amazing projects with Lightning zaps
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Goal
          </Button>
        </div>

        {!hasGoals ? (
          <EmptyGoalsState
            variant="no-goals"
            onCreateGoal={() => setIsCreateOpen(true)}
          />
        ) : (
          <>
            <GoalsFilter
              filter={filter}
              sort={sort}
              sortDirection={sortDirection}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onSortDirectionChange={handleSortDirectionChange}
              totalGoals={displayedTotalCount}
              filteredGoals={filteredGoalsCount}
              isLoggedIn={!!userPubkey}
              isLoading={backgroundLoading}
            />

            {goals.length === 0 ? (
              <EmptyGoalsState
                variant="no-results"
                onClearFilters={handleClearFilters}
              />
            ) : (
              <GoalsList
                goals={goals}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      <CreateGoalDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </main>
  );
};

export default Index;
