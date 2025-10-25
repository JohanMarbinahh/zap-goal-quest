import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export type FilterType = 'all' | 'completed' | 'active' | 'following';
export type SortType = 'date' | 'contributed' | 'progress' | 'zaps' | 'target';
export type SortDirection = 'asc' | 'desc';

interface GoalsFilterProps {
  filter: FilterType;
  sort: SortType;
  sortDirection: SortDirection;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  totalGoals: number;
  filteredGoals: number;
  isLoggedIn: boolean;
}

export const GoalsFilter = memo(({
  filter,
  sort,
  sortDirection,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
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

          <div className="flex gap-2">
            <Select value={sort} onValueChange={(value) => onSortChange(value as SortType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="contributed">Amount Contributed</SelectItem>
                <SelectItem value="progress">% Completion</SelectItem>
                <SelectItem value="zaps">Zaps Count</SelectItem>
                <SelectItem value="target">Target Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>

      {/* Active filter badges */}
      {(filter !== 'all' || sort !== 'date' || sortDirection !== 'desc') && (
        <div className="flex flex-wrap gap-2">
          {filter !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Badge>
          )}
          {(sort !== 'date' || sortDirection !== 'desc') && (
            <Badge variant="secondary" className="gap-2">
              Sort: {sort === 'date' ? 'Date Created' :
                     sort === 'contributed' ? 'Amount Contributed' :
                     sort === 'progress' ? '% Completion' :
                     sort === 'zaps' ? 'Zaps Count' :
                     'Target Amount'} ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

GoalsFilter.displayName = 'GoalsFilter';
