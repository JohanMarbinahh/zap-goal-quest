import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { RelayLoadingStatus } from '@/components/RelayLoadingStatus';
import { GoalsFilter, FilterType, SortType, SortDirection } from '@/components/GoalsFilter';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { store } from '@/stores/store';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { setFollowing } from '@/stores/contactsSlice';
import { addReaction, addMockReactions, mockProfiles } from '@/stores/reactionsSlice';
import { addUpdate } from '@/stores/updatesSlice';
import { selectEnrichedGoals } from '@/stores/selectors';
import { Goal9041 } from '@/types/nostr';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735, parseReaction7, parseGoalUpdate } from '@/lib/nostrHelpers';
import { filterGoals, sortGoals } from '@/lib/filterHelpers';
import { NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

const GOALS_PER_PAGE = 30;
const MAX_PAGES = 5;
const MIN_GOALS_TO_SHOW = 30; // Show page as soon as we have first page worth of goals
const MIN_LOADING_TIME = 1000; // Minimum 1 second loading
const MAX_LOADING_TIME = 5000; // Maximum 5 seconds loading

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const dispatch = useAppDispatch();
  const allGoals = useAppSelector(selectEnrichedGoals);
  const userPubkey = useAppSelector((state) => state.auth.pubkey);
  const followingList = useAppSelector((state) => 
    userPubkey ? state.contacts.following[userPubkey] || [] : []
  );
  
  // Initialize loading state based on whether we already have goals
  const [initialLoading, setInitialLoading] = useState(allGoals.length === 0);
  const [goalsLoadedCount, setGoalsLoadedCount] = useState(0);
  const [loadStartTime] = useState(Date.now());
  
  // Snapshot goals when loading completes to freeze the UI
  const [displayGoals, setDisplayGoals] = useState(allGoals);

  // Update goals loaded count during loading only
  useEffect(() => {
    if (initialLoading) {
      setGoalsLoadedCount(allGoals.length);
    }
  }, [allGoals.length, initialLoading]);
  
  // Memoize filtering, sorting, and pagination calculations
  // After loading, use allGoals for pagination but displayGoals for the count (to keep it stable)
  const { totalPages, goals, totalGoalsCount, filteredGoalsCount } = useMemo(() => {
    const goalsToUse = initialLoading ? displayGoals : allGoals;
    const filtered = filterGoals(goalsToUse, filter, followingList);
    const sorted = sortGoals(filtered, sort, sortDirection);
    
    const pages = Math.min(Math.ceil(sorted.length / GOALS_PER_PAGE), MAX_PAGES);
    const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
    const endIndex = startIndex + GOALS_PER_PAGE;
    const pageGoals = sorted.slice(startIndex, endIndex);
    
    return { 
      totalPages: pages, 
      goals: pageGoals,
      totalGoalsCount: displayGoals.length, // Keep count stable at initial load number
      filteredGoalsCount: sorted.length
    };
  }, [allGoals, displayGoals, initialLoading, currentPage, filter, sort, sortDirection, followingList]);
  
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

  useEffect(() => {
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;
    let zapSub: NDKSubscription | null = null;
    let contactSub: NDKSubscription | null = null;
    let reactionSub: NDKSubscription | null = null;
    let updateSub: NDKSubscription | null = null;
    let loadingTimeout: NodeJS.Timeout | null = null;
    let hasSubscribed = false;
    
    const subscribeToEvents = async () => {
      // Prevent multiple subscriptions
      if (hasSubscribed) {
        console.log('Already subscribed, skipping...');
        return;
      }
      hasSubscribed = true;
      
      // Skip if we already have goals loaded
      if (allGoals.length > 0) {
        console.log('Goals already loaded, skipping subscription');
        setDisplayGoals(allGoals);
        setInitialLoading(false);
        return;
      }
      
      try {
        // Set a timeout to stop loading after max time
        loadingTimeout = setTimeout(() => {
          console.log('⏱️ Max loading time reached - showing content');
          // Snapshot current goals to freeze the UI
          setDisplayGoals(selectEnrichedGoals(store.getState()));
          setInitialLoading(false);
        }, MAX_LOADING_TIME);

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
          setDisplayGoals([]);
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
            // Add mock reactions and profiles for demo purposes
            dispatch(addMockReactions(goal.eventId));
            Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
              dispatch(setProfile({ pubkey, profile }));
            });
            
            // Check if we've reached the minimum number of goals to show
            const currentCount = Object.keys(store.getState().goals.goals).length;
            const elapsedTime = Date.now() - loadStartTime;
            
            if (currentCount >= MIN_GOALS_TO_SHOW && elapsedTime >= MIN_LOADING_TIME) {
              console.log(`✅ ${currentCount} goals loaded - showing page!`);
              if (loadingTimeout) clearTimeout(loadingTimeout);
              // Snapshot current goals to freeze the UI
              setDisplayGoals(selectEnrichedGoals(store.getState()));
              setInitialLoading(false);
            }
          }
        });

        goalSub.on('eose', () => {
          const finalCount = Object.keys(store.getState().goals.goals).length;
          const elapsedTime = Date.now() - loadStartTime;
          
          console.log(`📋 Goal subscription complete - ${finalCount} total goals loaded in ${elapsedTime}ms`);
          
          // Stop the goal subscription to prevent further updates
          if (goalSub) {
            goalSub.stop();
            console.log('🛑 Stopped goal subscription after EOSE');
          }
          
          // Ensure minimum loading time has passed
          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
          
          if (remainingTime > 0) {
            console.log(`⏳ Waiting ${remainingTime}ms to meet minimum loading time`);
            setTimeout(() => {
              if (loadingTimeout) clearTimeout(loadingTimeout);
              // Snapshot current goals to freeze the counter
              setDisplayGoals(selectEnrichedGoals(store.getState()));
              setInitialLoading(false);
            }, remainingTime);
          } else {
            if (loadingTimeout) clearTimeout(loadingTimeout);
            // Snapshot current goals to freeze the counter
            setDisplayGoals(selectEnrichedGoals(store.getState()));
            setInitialLoading(false);
          }
          
          // After goals are loaded, subscribe to zaps for those specific goals
          const currentGoals = store.getState().goals.goals;
          const goalEventIds = Object.values(currentGoals).map((g: Goal9041) => g.eventId);
          
          console.log(`🔍 Testing zap availability for ${goalEventIds.length} goals`);
          
          // First, try subscribing to ALL recent zaps to see if any exist
          // This helps us debug if the relay has zaps at all
          const allZapsFilter: NDKFilter = { 
            kinds: [9735 as any],
            limit: 500 // Get recent 500 zaps to test
          };
          const testZapSub = ndk.subscribe(allZapsFilter, { closeOnEose: true });
          
          let zapCount = 0;
          let matchingZapCount = 0;
          const goalIdSet = new Set(goalEventIds);
          
          testZapSub.on('event', (event) => {
            zapCount++;
            const zap = parseZap9735(event);
            if (zap) {
              // Check if this zap targets any of our goals
              if (zap.targetEventId && goalIdSet.has(zap.targetEventId)) {
                matchingZapCount++;
                console.log('✅ MATCHING ZAP! Receipt:', zap.eventId.substring(0, 8), 'Target:', zap.targetEventId.substring(0, 8), 'Amount:', zap.amountMsat / 1000, 'sats');
                dispatch(addZap(zap));
              }
            }
          });
          
          testZapSub.on('eose', () => {
            console.log(`📊 Zap scan: ${zapCount} total zaps found, ${matchingZapCount} match our goals`);
            if (zapCount === 0) {
              console.warn('⚠️ NO ZAPS on relay - relay may not store zap receipts');
            } else if (matchingZapCount === 0) {
              console.warn('⚠️ Zaps exist but NONE match our goal event IDs');
            }
          });

          // Subscribe to kind 7 (reactions) for loaded goals
          if (goalEventIds.length > 0) {
            const reactionFilter: NDKFilter = { 
              kinds: [7 as any],
              '#e': goalEventIds,
              limit: 1000
            };
            reactionSub = ndk.subscribe(reactionFilter, { closeOnEose: false });
            
            reactionSub.on('event', (event) => {
              const reaction = parseReaction7(event);
              if (reaction) {
                console.log('👍 Reaction loaded:', reaction.content, 'on', reaction.targetEventId.substring(0, 8));
                dispatch(addReaction(reaction));
              }
            });
          }

          // Subscribe to kind 1 (updates) from goal authors
          const goalAuthors = [...new Set(Object.values(currentGoals).map((g: Goal9041) => g.authorPubkey))];
          
          if (goalAuthors.length > 0 && goalEventIds.length > 0) {
            const updateFilter: NDKFilter = {
              kinds: [1],
              authors: goalAuthors,
              '#e': goalEventIds,
              limit: 500
            };
            updateSub = ndk.subscribe(updateFilter, { closeOnEose: false });
            
            updateSub.on('event', (event) => {
              const update = parseGoalUpdate(event);
              if (update) {
                console.log('📝 Update loaded from', update.authorPubkey.substring(0, 8));
                dispatch(addUpdate(update));
              }
            });
          }
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
      console.log('🧹 Cleaning up subscriptions');
      if (goalSub) {
        goalSub.stop();
        console.log('Stopped goal subscription');
      }
      if (profileSub) {
        profileSub.stop();
        console.log('Stopped profile subscription');
      }
      if (zapSub) {
        zapSub.stop();
        console.log('Stopped zap subscription');
      }
      if (contactSub) {
        contactSub.stop();
        console.log('Stopped contact subscription');
      }
      if (reactionSub) {
        reactionSub.stop();
        console.log('Stopped reaction subscription');
      }
      if (updateSub) {
        updateSub.stop();
        console.log('Stopped update subscription');
      }
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []); // Only run once on mount

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
          <RelayLoadingStatus goalsLoaded={goalsLoadedCount} />
        ) : displayGoals.length === 0 ? (
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
              sortDirection={sortDirection}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onSortDirectionChange={handleSortDirectionChange}
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
                    setSort('date');
                    setSortDirection('desc');
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
