import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUp, ArrowDown, Search } from 'lucide-react';

export type FilterType = 'all' | 'completed' | 'active' | 'following';
export type SortType = 'date' | 'contributed' | 'progress' | 'zaps' | 'target' | 'upvotes';
export type SortDirection = 'asc' | 'desc';

interface GoalsFilterProps {
  filter: FilterType;
  sort: SortType;
  sortDirection: SortDirection;
  searchQuery: string;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortType) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onSearchChange: (query: string) => void;
  totalGoals: number;
  filteredGoals: number;
  isLoggedIn: boolean;
  isLoading?: boolean;
}

export const GoalsFilter = memo(({
  filter,
  sort,
  sortDirection,
  searchQuery,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
  onSearchChange,
  totalGoals,
  filteredGoals,
  isLoggedIn,
  isLoading = false,
}: GoalsFilterProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search goals by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {totalGoals.toLocaleString()} {totalGoals === 1 ? 'goal' : 'goals'}
            {isLoading && totalGoals % 100 === 0 && '+'}
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
                <SelectItem value="upvotes">Most Upvoted</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="gap-2 min-w-[140px]"
              onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-4 h-4" />
                  Ascending
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4" />
                  Descending
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Active filter badges */}
      {(filter !== 'all' || sort !== 'date' || sortDirection !== 'desc' || searchQuery) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-2">
              Search: "{searchQuery}"
            </Badge>
          )}
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
                     sort === 'upvotes' ? 'Most Upvoted' :
                     'Target Amount'} ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

GoalsFilter.displayName = 'GoalsFilter';
