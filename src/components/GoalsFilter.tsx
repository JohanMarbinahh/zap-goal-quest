import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

export type FilterType = 'all' | 'completed' | 'active' | 'following';
export type SortType = 'recent' | 'oldest' | 'highest' | 'lowest' | 'almost-funded' | 'most-zaps';

interface GoalsFilterProps {
  filter: FilterType;
  sort: SortType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  totalGoals: number;
  filteredGoals: number;
  isLoggedIn: boolean;
}

export const GoalsFilter = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  totalGoals,
  filteredGoals,
  isLoggedIn,
}: GoalsFilterProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Showing {filteredGoals} of {totalGoals} goals
          </span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onValueChange={(value) => onFilterChange(value as FilterType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              {isLoggedIn && <SelectItem value="following">Following</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => onSortChange(value as SortType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Created</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Funded</SelectItem>
              <SelectItem value="lowest">Least Funded</SelectItem>
              <SelectItem value="almost-funded">Almost Funded</SelectItem>
              <SelectItem value="most-zaps">Most Zaps</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter badges */}
      {(filter !== 'all' || sort !== 'recent') && (
        <div className="flex flex-wrap gap-2">
          {filter !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Badge>
          )}
          {sort !== 'recent' && (
            <Badge variant="secondary" className="gap-2">
              Sort: {sort === 'oldest' ? 'Oldest First' :
                     sort === 'highest' ? 'Highest Funded' :
                     sort === 'lowest' ? 'Least Funded' :
                     sort === 'almost-funded' ? 'Almost Funded' :
                     'Most Zaps'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
