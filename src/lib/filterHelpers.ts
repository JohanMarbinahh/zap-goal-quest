import { EnrichedGoal } from '@/stores/selectors';
import { FilterType, SortType } from '@/components/GoalsFilter';

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

export const sortGoals = (goals: EnrichedGoal[], sortType: SortType): EnrichedGoal[] => {
  const sorted = [...goals];
  
  switch (sortType) {
    case 'recent':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'most-sats':
      return sorted.sort((a, b) => b.raised - a.raised);
    case 'least-sats':
      return sorted.sort((a, b) => a.raised - b.raised);
    case 'best-progress':
      return sorted.sort((a, b) => b.progress - a.progress);
    case 'most-zaps':
      return sorted.sort((a, b) => b.zaps.length - a.zaps.length);
    case 'highest-target':
      return sorted.sort((a, b) => b.targetSats - a.targetSats);
    default:
      return sorted;
  }
};
