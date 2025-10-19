import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { Spinner } from '@/components/ui/spinner';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735 } from '@/lib/nostrHelpers';
import { NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

const Index = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1]));
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const allGoals = useAppSelector((state) => Object.values(state.goals.goals));
  
  const GOALS_PER_PAGE = 100;
  const MAX_PAGES = 5;
  
  // Memoize pagination calculations
  const { totalPages, goals } = useMemo(() => {
    const pages = Math.min(Math.ceil(allGoals.length / GOALS_PER_PAGE), MAX_PAGES);
    const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
    const endIndex = startIndex + GOALS_PER_PAGE;
    const pageGoals = allGoals.slice(startIndex, endIndex);
    
    return { totalPages: pages, goals: pageGoals };
  }, [allGoals, currentPage, GOALS_PER_PAGE, MAX_PAGES]);
  
  const handlePageChange = useCallback(async (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    
    // If this page hasn't been loaded yet, show loading
    if (!loadedPages.has(page)) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadedPages(prev => new Set(prev).add(page));
      setIsLoading(false);
    }
  }, [currentPage, totalPages, loadedPages]);

  useEffect(() => {
    // Skip if already subscribed
    if (allGoals.length > 0) {
      return;
    }
    
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;
    let zapSub: NDKSubscription | null = null;
    
    const subscribeToEvents = async () => {
      try {
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
        const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 200 };
        zapSub = ndk.subscribe(zapFilter);

        zapSub.on('event', (event) => {
          const zap = parseZap9735(event);
          if (zap) {
            dispatch(addZap(zap));
          }
        });
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
    };
  }, [dispatch]); // Only run once on mount, skip if data already exists

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
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

        {goals.length === 0 ? (
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
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
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
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
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
