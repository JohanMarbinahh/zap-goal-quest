import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { GoalsFilter, FilterType, SortType } from '@/components/GoalsFilter';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { setFollowing } from '@/stores/contactsSlice';
import { selectEnrichedGoals } from '@/stores/selectors';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735 } from '@/lib/nostrHelpers';
import { filterGoals, sortGoals } from '@/lib/filterHelpers';
import { NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

const GOALS_PER_PAGE = 30;
const MAX_PAGES = 5;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  
  const dispatch = useAppDispatch();
  const allGoals = useAppSelector(selectEnrichedGoals);
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  const followingList = useAppSelector((state) => 
    userPubkey ? state.contacts.following[userPubkey] || [] : []
  );
  
  // Initialize loading state based on whether we already have goals
  const [initialLoading, setInitialLoading] = useState(allGoals.length === 0);
  
  // Memoize filtering, sorting, and pagination calculations
  const { totalPages, goals, totalGoalsCount, filteredGoalsCount } = useMemo(() => {
    const filtered = filterGoals(allGoals, filter, followingList);
    const sorted = sortGoals(filtered, sort);
    
    const pages = Math.min(Math.ceil(sorted.length / GOALS_PER_PAGE), MAX_PAGES);
    const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
    const endIndex = startIndex + GOALS_PER_PAGE;
    const pageGoals = sorted.slice(startIndex, endIndex);
    
    return { 
      totalPages: pages, 
      goals: pageGoals,
      totalGoalsCount: allGoals.length,
      filteredGoalsCount: sorted.length
    };
  }, [allGoals, currentPage, filter, sort, followingList]);
  
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

  useEffect(() => {
    // Skip if already subscribed
    if (allGoals.length > 0) {
      setInitialLoading(false);
      return;
    }
    
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;
    let zapSub: NDKSubscription | null = null;
    let contactSub: NDKSubscription | null = null;
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    const subscribeToEvents = async () => {
      try {
        // Set a timeout to stop loading after 10 seconds regardless
        loadingTimeout = setTimeout(() => {
          console.log('Loading timeout - stopping spinner');
          setInitialLoading(false);
        }, 10000);

        // Wait for NDK to be initialized
        let ndk;
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
          try {
            ndk = getNDK();
            break;
          } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
        }

        if (!ndk) {
          console.error('NDK failed to initialize');
          setInitialLoading(false);
          return;
        }

        // Subscribe to kind 9041 (goals)
        const goalFilter: NDKFilter = { kinds: [9041 as any], limit: 500 };
        goalSub = ndk.subscribe(goalFilter, { closeOnEose: false });

        goalSub.on('event', (event) => {
          const goal = parseGoal9041(event);
          if (goal) {
            dispatch(setGoal({ goalId: goal.goalId, goal }));
          }
        });

        goalSub.on('eose', () => {
          console.log('Goal subscription eose received');
          if (loadingTimeout) clearTimeout(loadingTimeout);
          setInitialLoading(false);
        });

        // Subscribe to kind 0 (profiles)
        const profileFilter: NDKFilter = { kinds: [0], limit: 50 };
        profileSub = ndk.subscribe(profileFilter);

        profileSub.on('event', (event) => {
          const profile = parseProfile(event);
          if (profile) {
            dispatch(setProfile({ pubkey: profile.pubkey, profile }));
          }
        });

        // Subscribe to kind 9735 (zaps)
        const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 1000 };
        zapSub = ndk.subscribe(zapFilter, { closeOnEose: false });

        zapSub.on('event', (event) => {
          const zap = parseZap9735(event);
          if (zap) {
            console.log('Received zap:', zap);
            dispatch(addZap(zap));
          }
        });
        
        zapSub.on('eose', () => {
          console.log('Zap subscription complete');
        });

        // Subscribe to kind 3 (contact lists) - only if user is logged in
        if (userPubkey) {
          const contactFilter: NDKFilter = { kinds: [3], authors: [userPubkey] };
          contactSub = ndk.subscribe(contactFilter);

          contactSub.on('event', (event) => {
            const following = event.tags
              .filter(tag => tag[0] === 'p')
              .map(tag => tag[1]);
            
            if (following.length > 0) {
              dispatch(setFollowing({ pubkey: userPubkey, following }));
            }
          });
        }
      } catch (error) {
        console.error('Failed to subscribe to events:', error);
      }
    };

    subscribeToEvents();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (goalSub) goalSub.stop();
      if (profileSub) profileSub.stop();
      if (zapSub) zapSub.stop();
      if (contactSub) contactSub.stop();
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [dispatch, userPubkey]); // Only run once on mount, skip if data already exists

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

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        ) : totalGoalsCount === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-6 rounded-full bg-primary/10 mb-4">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create a fundraising goal!
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <>
            <GoalsFilter
              filter={filter}
              sort={sort}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              totalGoals={totalGoalsCount}
              filteredGoals={filteredGoalsCount}
              isLoggedIn={!!userPubkey}
            />
            
            {goals.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold mb-2">No goals found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilter('all');
                    setSort('recent');
                    setSearchParams({ page: '1' });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                  <GoalCard key={goal.goalId} goal={goal} />
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className="w-10"
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateGoalDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </main>
  );
};

export default Index;
