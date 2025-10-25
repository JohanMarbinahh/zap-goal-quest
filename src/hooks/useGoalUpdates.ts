import { useState, useEffect } from 'react';
import { getNDK } from '@/lib/ndk';
import { parseGoalUpdate } from '@/lib/nostrHelpers';
import type { NDKFilter, NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';
import type { GoalUpdate } from '@/types/nostr';

export const useGoalUpdates = (goalEventId: string, authorPubkey: string) => {
  const [updates, setUpdates] = useState<GoalUpdate[]>([]);

  useEffect(() => {
    let updateSub: NDKSubscription | null = null;

    const subscribeToUpdates = async () => {
      try {
        const ndk = getNDK();
        const updateFilter: NDKFilter = {
          kinds: [1],
          authors: [authorPubkey],
          '#e': [goalEventId],
          limit: 50,
        };

        updateSub = ndk.subscribe(updateFilter, { closeOnEose: false });

        updateSub.on('event', (event: NDKEvent) => {
          const update = parseGoalUpdate(event);
          if (update) {
            setUpdates(prev => {
              const exists = prev.some(u => u.eventId === update.eventId);
              return exists ? prev : [...prev, update].sort((a, b) => b.createdAt - a.createdAt);
            });
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to updates:', error);
      }
    };

    subscribeToUpdates();

    return () => {
      updateSub?.stop();
    };
  }, [goalEventId, authorPubkey]);

  return updates;
};
