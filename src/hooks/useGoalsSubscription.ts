import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '@/stores/hooks';
import { store } from '@/stores/store';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
import { setFollowing } from '@/stores/contactsSlice';
import { selectEnrichedGoals, EnrichedGoal } from '@/stores/selectors';
import { Goal9041 } from '@/types/nostr';
import { getNDK } from '@/lib/ndk';
import { parseGoal9041, parseProfile, parseZap9735 } from '@/lib/nostrHelpers';
import type { NDKFilter, NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';

// Mock profiles for demo
const mockProfiles = {
  mock1: { pubkey: 'mock1', name: 'Alice', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  mock2: { pubkey: 'mock2', name: 'Bob', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  mock3: { pubkey: 'mock3', name: 'Charlie', picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
};

const MIN_LOADING_TIME = 1000;
const MAX_GOALS_TO_LOAD = 100;
const IS_DEV = import.meta.env.DEV;

interface UseGoalsSubscriptionResult {
  initialLoading: boolean;
  backgroundLoading: boolean;
  goalsLoadedCount: number;
  displayedTotalCount: number;
  frozenGoals: EnrichedGoal[];
}

export const useGoalsSubscription = (
  existingGoals: EnrichedGoal[],
  userPubkey: string | null
): UseGoalsSubscriptionResult => {
  const dispatch = useAppDispatch();
  const [initialLoading, setInitialLoading] = useState(existingGoals.length === 0);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [goalsLoadedCount, setGoalsLoadedCount] = useState(0);
  const [displayedTotalCount, setDisplayedTotalCount] = useState(0);
  const [frozenGoals, setFrozenGoals] = useState<EnrichedGoal[]>([]);
  const loadStartTime = useRef(Date.now());
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (initialLoading) {
      setGoalsLoadedCount(existingGoals.length);
    }
  }, [existingGoals.length, initialLoading]);

  useEffect(() => {
    if (!initialLoading && backgroundLoading) {
      const roundedCount = Math.floor(existingGoals.length / 100) * 100;
      if (roundedCount > displayedTotalCount) {
        setDisplayedTotalCount(roundedCount);
      }
    } else if (!backgroundLoading) {
      setDisplayedTotalCount(existingGoals.length);
    }
  }, [existingGoals.length, initialLoading, backgroundLoading, displayedTotalCount]);

  useEffect(() => {
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;
    let contactSub: NDKSubscription | null = null;

    const subscribeToEvents = async () => {
      if (hasSubscribed.current) {
        if (IS_DEV) console.log('Already subscribed, skipping...');
        return;
      }
      hasSubscribed.current = true;

      if (existingGoals.length > 0) {
        if (IS_DEV) console.log('Goals already loaded, skipping subscription');
        setInitialLoading(false);
        return;
      }

      try {
        const ndk = await initializeNDK();
        if (!ndk) {
          setInitialLoading(false);
          return;
        }

        goalSub = await subscribeToGoals(ndk);
        profileSub = await subscribeToProfiles(ndk);
        if (userPubkey) {
          contactSub = await subscribeToContacts(ndk, userPubkey);
        }
      } catch (error) {
        console.error('Failed to subscribe to events:', error);
      }
    };

    const initializeNDK = async () => {
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        try {
          return getNDK();
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
      }

      console.error('NDK failed to initialize');
      return null;
    };

    const subscribeToGoals = async (ndk: any): Promise<NDKSubscription> => {
      const goalFilter: NDKFilter = { kinds: [9041 as any] };
      const sub = ndk.subscribe(goalFilter, { closeOnEose: false });
      let loadingScreenShown = false;

      sub.on('event', (event: NDKEvent) => {
        const goal = parseGoal9041(event);
        if (goal) {
          dispatch(setGoal({ goalId: goal.goalId, goal }));

          const currentCount = Object.keys(store.getState().goals.goals).length;
          const elapsedTime = Date.now() - loadStartTime.current;

          if (!loadingScreenShown && currentCount >= MAX_GOALS_TO_LOAD && elapsedTime >= MIN_LOADING_TIME) {
            if (IS_DEV) console.log(`✅ Reached ${currentCount} goals - showing page!`);
            loadingScreenShown = true;

            Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
              dispatch(setProfile({ pubkey, profile }));
            });

            setFrozenGoals(selectEnrichedGoals(store.getState()));
            setInitialLoading(false);
            setBackgroundLoading(true);
            setDisplayedTotalCount(Math.floor(currentCount / 100) * 100);
          }
        }
      });

      sub.on('eose', () => {
        const finalCount = Object.keys(store.getState().goals.goals).length;
        const elapsedTime = Date.now() - loadStartTime.current;

        if (IS_DEV) console.log(`📋 ${finalCount} goals loaded in ${elapsedTime}ms`);

        setBackgroundLoading(false);
        setDisplayedTotalCount(finalCount);

        if (!loadingScreenShown) {
          Object.entries(mockProfiles).forEach(([pubkey, profile]) => {
            dispatch(setProfile({ pubkey, profile }));
          });

          setFrozenGoals(selectEnrichedGoals(store.getState()));

          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

          if (remainingTime > 0) {
            setTimeout(() => setInitialLoading(false), remainingTime);
          } else {
            setInitialLoading(false);
          }
        }

        subscribeToRelatedData(ndk);
      });

      return sub;
    };

    const subscribeToRelatedData = (ndk: any): void => {
      const currentGoals = store.getState().goals.goals;
      const goalEventIds = Object.values(currentGoals).map((g: Goal9041) => g.eventId);

      if (IS_DEV) console.log(`🔍 Subscribing to data for ${goalEventIds.length} goals`);

      const allZapsFilter: NDKFilter = {
        kinds: [9735 as any],
        limit: 500
      };
      const testZapSub = ndk.subscribe(allZapsFilter, { closeOnEose: true });

      let zapCount = 0;
      let matchingZapCount = 0;
      const goalIdSet = new Set(goalEventIds);

      testZapSub.on('event', (event: NDKEvent) => {
        zapCount++;
        const zap = parseZap9735(event);
        if (zap && zap.targetEventId && goalIdSet.has(zap.targetEventId)) {
          matchingZapCount++;
          dispatch(addZap(zap));
        }
      });

      testZapSub.on('eose', () => {
        if (IS_DEV) console.log(`📊 ${zapCount} zaps found, ${matchingZapCount} matched`);
      });
    };

    const subscribeToProfiles = async (ndk: any): Promise<NDKSubscription> => {
      const profileFilter: NDKFilter = { kinds: [0], limit: 50 };
      const sub = ndk.subscribe(profileFilter);

      sub.on('event', (event: NDKEvent) => {
        const profile = parseProfile(event);
        if (profile) {
          dispatch(setProfile({ pubkey: profile.pubkey, profile }));
        }
      });

      return sub;
    };

    const subscribeToContacts = async (ndk: any, pubkey: string): Promise<NDKSubscription> => {
      const contactFilter: NDKFilter = { kinds: [3], authors: [pubkey] };
      const sub = ndk.subscribe(contactFilter);

      sub.on('event', (event: NDKEvent) => {
        const following = event.tags
          .filter((tag: string[]) => tag[0] === 'p')
          .map((tag: string[]) => tag[1]);

        if (following.length > 0) {
          dispatch(setFollowing({ pubkey, following }));
        }
      });

      return sub;
    };

    subscribeToEvents();

    return () => {
      if (IS_DEV) console.log('🧹 Cleaning up subscriptions');
      goalSub?.stop();
      profileSub?.stop();
      contactSub?.stop();
    };
  }, []);

  return {
    initialLoading,
    backgroundLoading,
    goalsLoadedCount,
    displayedTotalCount,
    frozenGoals,
  };
};
