import { EnrichedGoal } from '@/stores/selectors';
import { FilterType, SortType, SortDirection } from '@/components/GoalsFilter';

export const filterGoals = (
  goals: EnrichedGoal[],
  filterType: FilterType,
  searchQuery: string = ''
): EnrichedGoal[] => {
  let filtered = goals;

  // Apply type filter
  if (filterType === 'active') {
    filtered = filtered.filter(goal => goal.progress < 100);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(goal => {
      const title = (goal.title || goal.name || '').toLowerCase();
      const summary = (goal.summary || '').toLowerCase();
      const description = (goal.description || '').toLowerCase();
      
      return title.includes(query) || 
             summary.includes(query) || 
             description.includes(query);
    });
  }

  return filtered;
};

export const sortGoals = (
  goals: EnrichedGoal[], 
  sortType: SortType, 
  direction: SortDirection
): EnrichedGoal[] => {
  const sorted = [...goals];
  const multiplier = direction === 'desc' ? -1 : 1;
  
  if (sortType === 'date') {
    return sorted.sort((a, b) => multiplier * (b.createdAt - a.createdAt));
  } else {
    return sorted.sort((a, b) => multiplier * (b.raised - a.raised));
  }
};
