import { EnrichedGoal } from '@/stores/selectors';
import { FilterType, SortType, SortDirection } from '@/components/GoalsFilter';

export const filterGoals = (
  goals: EnrichedGoal[],
  filterType: FilterType,
  followingList: string[] = [],
  searchQuery: string = ''
): EnrichedGoal[] => {
  let filtered = goals;

  // Apply type filter
  switch (filterType) {
    case 'completed':
      filtered = filtered.filter(goal => goal.progress >= 100);
      break;
    case 'active':
      filtered = filtered.filter(goal => goal.progress < 100);
      break;
    case 'following':
      filtered = filtered.filter(goal => followingList.includes(goal.authorPubkey));
      break;
    case 'all':
    default:
      break;
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
  
  switch (sortType) {
    case 'date':
      return sorted.sort((a, b) => multiplier * (b.createdAt - a.createdAt));
    case 'contributed':
      return sorted.sort((a, b) => multiplier * (b.raised - a.raised));
    case 'progress':
      return sorted.sort((a, b) => multiplier * (b.progress - a.progress));
    case 'zaps':
      return sorted.sort((a, b) => multiplier * (b.zaps.length - a.zaps.length));
    case 'target':
      return sorted.sort((a, b) => multiplier * (b.targetSats - a.targetSats));
    case 'upvotes':
      return sorted.sort((a, b) => multiplier * (b.upvotes - a.upvotes));
    default:
      return sorted;
  }
};
