import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735 } from '@/lib/nostrHelpers';
import { NDKFilter } from '@nostr-dev-kit/ndk';

const Index = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useAppDispatch();
  const goalsState = useAppSelector((state) => state.goals);
  const allGoals = useAppSelector((state) => Object.values(state.goals.goals));
  
  const GOALS_PER_PAGE = 100;
  const MAX_PAGES = 5;
  const totalGoals = Math.min(allGoals.length, GOALS_PER_PAGE * MAX_PAGES);
  const totalPages = Math.min(Math.ceil(allGoals.length / GOALS_PER_PAGE), MAX_PAGES);
  
  // Calculate goals for current page
  const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
  const endIndex = startIndex + GOALS_PER_PAGE;
  const goals = allGoals.slice(startIndex, endIndex);
  
  console.log('🏠 Homepage state:', {
    goalsInState: Object.keys(goalsState.goals).length,
    currentPage,
    totalPages,
    goalsDisplayed: goals.length,
    startIndex,
    endIndex,
  });

  useEffect(() => {
    const subscribeToEvents = async () => {
      try {
        // Wait for NDK to be initialized with a retry mechanism
        let ndk;
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
          try {
            ndk = getNDK();
            break;
          } catch (error) {
            // NDK not ready yet, wait and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }
        }

        if (!ndk) {
          console.error('NDK failed to initialize after retries');
          return;
        }

        // Log connected relays
        console.log('📡 Connected relays:', Array.from(ndk.pool.relays.keys()));
        console.log('🔌 Relay statuses:', 
          Array.from(ndk.pool.relays.entries()).map(([url, relay]) => ({
            url,
            connected: relay.status === 1 // 1 = connected
          }))
        );

        // Subscribe to kind 9041 (goals) - fetch all goals from relay pool
        console.log('🔍 Starting subscription to kind 9041 goals...');
        console.log('📝 Filter:', { kinds: [9041], limit: 500 });
        const goalFilter: NDKFilter = { kinds: [9041 as any], limit: 500 };
        const goalSub = ndk.subscribe(goalFilter, { closeOnEose: false });

        let eventCount = 0;
        const relayEvents = new Map<string, number>();

        goalSub.on('event', (event, relay) => {
          eventCount++;
          
          // Track which relay sent this event
          const relayUrl = relay?.url || 'unknown';
          relayEvents.set(relayUrl, (relayEvents.get(relayUrl) || 0) + 1);
          
          console.log(`📥 Event #${eventCount} from ${relayUrl}:`, {
            id: event.id,
            pubkey: event.pubkey,
            kind: event.kind,
            content: event.content?.substring(0, 100),
            tags: event.tags,
            created_at: event.created_at
          });
          
          const goal = parseGoal9041(event);
          if (goal) {
            console.log('✅ Successfully parsed goal:', {
              goalId: goal.goalId,
              title: goal.title,
              targetSats: goal.targetSats,
              from: relayUrl
            });
            dispatch(setGoal({ goalId: goal.goalId, goal }));
          } else {
            console.warn('❌ Failed to parse goal event:', event.id);
          }
        });

        goalSub.on('eose', (relay) => {
          console.log(`✨ EOSE from ${relay?.url || 'unknown'}`);
        });

        // Log summary after all relays respond
        setTimeout(() => {
          console.log(`\n📊 SUMMARY: Received ${eventCount} goal events total`);
          console.log('📈 Events per relay:');
          relayEvents.forEach((count, url) => {
            console.log(`  ${url}: ${count} events`);
          });
          console.log('💾 Goals in store:', Object.keys(goals).length);
          console.log('🎯 Unique authors:', new Set(Object.values(goals).map(g => g.authorPubkey)).size);
        }, 5000);

        // Subscribe to kind 0 (profiles) for authors
        const profileFilter: NDKFilter = { kinds: [0], limit: 100 };
        const profileSub = ndk.subscribe(profileFilter);

        profileSub.on('event', (event) => {
          const profile = parseProfile(event);
          if (profile) {
            dispatch(setProfile({ pubkey: profile.pubkey, profile }));
          }
        });

        // Subscribe to kind 9735 (zaps)
        const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 500 };
        const zapSub = ndk.subscribe(zapFilter);

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
  }, [dispatch]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard key={goal.goalId} goal={goal} />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
