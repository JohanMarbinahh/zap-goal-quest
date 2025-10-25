import { EnrichedGoal } from '@/stores/selectors';
import { FilterType, SortType, SortDirection } from '@/components/GoalsFilter';

export const filterGoals = (
  goals: EnrichedGoal[],
  filterType: FilterType,
  followingList: string[] = []
): EnrichedGoal[] => {
  switch (filterType) {
    case 'completed':
      return goals.filter(goal => goal.progress >= 100);
    case 'active':
      return goals.filter(goal => goal.progress < 100);
    case 'following':
      return goals.filter(goal => followingList.includes(goal.authorPubkey));
    case 'all':
    default:
      return goals;
  }
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
    default:
      return sorted;
  }
};
