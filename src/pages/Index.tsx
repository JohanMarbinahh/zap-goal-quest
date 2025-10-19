import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { useGoalsStore } from '@/stores/goalsStore';
import { useProfilesStore } from '@/stores/profilesStore';
import { useZapsStore } from '@/stores/zapsStore';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735 } from '@/lib/nostrHelpers';
import { NDKFilter } from '@nostr-dev-kit/ndk';

const Index = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { setGoal, getAllGoals } = useGoalsStore();
  const { setProfile } = useProfilesStore();
  const { addZap } = useZapsStore();
  const goals = getAllGoals();

  useEffect(() => {
    const subscribeToEvents = async () => {
      try {
        const ndk = getNDK();

        // Subscribe to kind 9041 (goals)
        const goalFilter: NDKFilter = { kinds: [9041 as any], limit: 100 };
        const goalSub = ndk.subscribe(goalFilter);

        goalSub.on('event', (event) => {
          const goal = parseGoal9041(event);
          if (goal) {
            setGoal(goal.goalId, goal);
          }
        });

        // Subscribe to kind 0 (profiles) for authors
        const profileFilter: NDKFilter = { kinds: [0], limit: 100 };
        const profileSub = ndk.subscribe(profileFilter);

        profileSub.on('event', (event) => {
          const profile = parseProfile(event);
          if (profile) {
            setProfile(profile.pubkey, profile);
          }
        });

        // Subscribe to kind 9735 (zaps)
        const zapFilter: NDKFilter = { kinds: [9735 as any], limit: 500 };
        const zapSub = ndk.subscribe(zapFilter);

        zapSub.on('event', (event) => {
          const zap = parseZap9735(event);
          if (zap) {
            addZap(zap);
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to events:', error);
      }
    };

    subscribeToEvents();
  }, [setGoal, setProfile, addZap]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard key={goal.goalId} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <CreateGoalDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </main>
  );
};

export default Index;
