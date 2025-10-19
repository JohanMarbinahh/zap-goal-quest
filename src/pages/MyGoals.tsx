import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { useGoalsStore } from '@/stores/goalsStore';
import { useAuthStore } from '@/stores/authStore';

const MyGoals = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { getAllGoals } = useGoalsStore();
  const { pubkey } = useAuthStore();
  
  const myGoals = getAllGoals().filter((goal) => goal.authorPubkey === pubkey);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              My Goals
            </h1>
            <p className="text-muted-foreground">
              Manage your fundraising campaigns
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Goal
          </Button>
        </div>

        {myGoals.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-6 rounded-full bg-primary/10 mb-4">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first fundraising goal to get started!
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGoals.map((goal) => (
              <GoalCard key={goal.goalId} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <CreateGoalDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </main>
  );
};

export default MyGoals;
