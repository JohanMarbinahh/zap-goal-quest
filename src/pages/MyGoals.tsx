import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/GoalCard';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAppSelector, useAppDispatch } from '@/stores/hooks';
import { selectEnrichedGoals } from '@/stores/selectors';
import { getNDK } from '@/lib/ndk';
import { parseProfile } from '@/lib/nostrHelpers';
import { setProfile } from '@/stores/profilesSlice';
import { NDKFilter } from '@nostr-dev-kit/ndk';

const MyGoals = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const dispatch = useAppDispatch();
  const allGoals = useAppSelector(selectEnrichedGoals);
  const pubkey = useAppSelector((state) => state.auth.pubkey);
  const profile = useAppSelector((state) => pubkey ? state.profiles.profiles[pubkey] : null);
  
  // Memoize filtered goals
  const myGoals = useMemo(() => 
    allGoals.filter((goal) => goal.authorPubkey === pubkey),
    [allGoals, pubkey]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!pubkey || profile) return; // Don't fetch if already have profile

      try {
        const ndk = getNDK();
        const profileFilter: NDKFilter = { kinds: [0], authors: [pubkey], limit: 1 };
        const events = await ndk.fetchEvents(profileFilter);
        
        if (events.size > 0) {
          const event = Array.from(events)[0];
          const parsedProfile = parseProfile(event);
          
          if (parsedProfile) {
            dispatch(setProfile({ pubkey, profile: parsedProfile }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
    // Only run when pubkey changes, not when profile changes
  }, [pubkey, dispatch]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Section */}
        <div className="mb-8 p-6 rounded-lg border bg-card">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.picture} alt={profile?.name || 'User'} />
              <AvatarFallback className="text-2xl">
                {(profile?.name || profile?.displayName || profile?.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {profile?.displayName || profile?.display_name || profile?.name || 'Anonymous'}
              </h2>
              {profile?.about && (
                <p className="text-muted-foreground mb-2">{profile.about}</p>
              )}
              {profile?.lud16 && (
                <p className="text-sm text-muted-foreground">⚡ {profile.lud16}</p>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
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
