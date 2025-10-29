import { useMemo } from 'react';
import { EnrichedGoal } from '@/stores/selectors';
import { FilterType, SortType, SortDirection } from '@/components/GoalsFilter';
import { filterGoals, sortGoals } from '@/lib/filterHelpers';

const GOALS_PER_PAGE = 30;
const MAX_PAGES = 5;

interface UseGoalsDisplayResult {
  goals: EnrichedGoal[];
  totalPages: number;
  totalGoalsCount: number;
  filteredGoalsCount: number;
}

export const useGoalsDisplay = (
  allGoals: EnrichedGoal[],
  frozenGoals: EnrichedGoal[],
  currentPage: number,
  filter: FilterType,
  sort: SortType,
  sortDirection: SortDirection,
  searchQuery: string = ''
): UseGoalsDisplayResult => {
  return useMemo(() => {
    const goalsToDisplay = frozenGoals.length > 0 ? frozenGoals : allGoals;
    const filtered = filterGoals(goalsToDisplay, filter, searchQuery);
    const sorted = sortGoals(filtered, sort, sortDirection);

    const pages = Math.min(Math.ceil(sorted.length / GOALS_PER_PAGE), MAX_PAGES);
    const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
    const endIndex = startIndex + GOALS_PER_PAGE;
    const pageGoals = sorted.slice(startIndex, endIndex);

    return {
      totalPages: pages,
      goals: pageGoals,
      totalGoalsCount: goalsToDisplay.length,
      filteredGoalsCount: sorted.length,
    };
  }, [frozenGoals, allGoals, currentPage, filter, sort, sortDirection, searchQuery]);
};
