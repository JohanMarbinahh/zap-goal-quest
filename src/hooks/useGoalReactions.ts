import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setProfile } from '@/stores/profilesSlice';
import { addReaction } from '@/stores/reactionsSlice';
import { getNDK } from '@/lib/ndk';
import { parseReaction7 } from '@/lib/nostrHelpers';
import type { NDKFilter, NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';
import type { Reaction7 } from '@/types/nostr';

// Mock data for demo
const mockReactions: Reaction7[] = [
  { eventId: '', targetEventId: '', authorPubkey: 'mock1', content: '+', createdAt: Date.now() / 1000 },
  { eventId: '', targetEventId: '', authorPubkey: 'mock2', content: '+', createdAt: Date.now() / 1000 },
  { eventId: '', targetEventId: '', authorPubkey: 'mock3', content: '-', createdAt: Date.now() / 1000 },
];

export const mockProfiles = {
  mock1: { pubkey: 'mock1', name: 'Alice', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  mock2: { pubkey: 'mock2', name: 'Bob', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  mock3: { pubkey: 'mock3', name: 'Charlie', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
};

export const useGoalReactions = (goalEventId: string) => {
  const [reactions, setReactions] = useState<Reaction7[]>([]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Add mock reactions
    const mockedReactions = mockReactions.map(r => ({
      ...r,
      targetEventId: goalEventId,
      eventId: `mock-reaction-${r.authorPubkey}-${goalEventId}`,
    }));
    setReactions(mockedReactions);

    // Add mock profiles
    Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
      dispatch(setProfile({ pubkey, profile }));
    });

    let reactionSub: NDKSubscription | null = null;

    const subscribeToReactions = async () => {
      try {
        const ndk = getNDK();
        const reactionFilter: NDKFilter = {
          kinds: [7 as any],
          '#e': [goalEventId],
          limit: 100,
        };

        reactionSub = ndk.subscribe(reactionFilter, { closeOnEose: false });

        reactionSub.on('event', (event: NDKEvent) => {
          const reaction = parseReaction7(event);
          if (reaction) {
            // Dispatch to Redux store so all components can access it
            dispatch(addReaction(reaction));
            
            // Also update local state for this component
            setReactions(prev => {
              const exists = prev.some(r => r.eventId === reaction.eventId);
              return exists ? prev : [...prev, reaction];
            });
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to reactions:', error);
      }
    };

    subscribeToReactions();

    return () => {
      reactionSub?.stop();
    };
  }, [goalEventId, dispatch]);

  return reactions;
};
