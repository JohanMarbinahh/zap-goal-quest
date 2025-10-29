import { useEffect, useState, useRef } from 'react';
import { useAppDispatch } from '@/stores/hooks';
import { store } from '@/stores/store';
import { setGoal } from '@/stores/goalsSlice';
import { setProfile } from '@/stores/profilesSlice';
import { addZap } from '@/stores/zapsSlice';
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
  const [displayedTotalCount, setDisplayedTotalCount] = useState(0);
  const [frozenGoals, setFrozenGoals] = useState<EnrichedGoal[]>([]);
  const loadStartTime = useRef(Date.now());
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (!initialLoading && backgroundLoading) {
      const roundedCount = Math.floor(existingGoals.length / 100) * 100;
      if (roundedCount > displayedTotalCount) {
        setDisplayedTotalCount(roundedCount);
      }
    } else if (!backgroundLoading && displayedTotalCount !== existingGoals.length) {
      setDisplayedTotalCount(existingGoals.length);
    }
  }, [existingGoals.length, initialLoading, backgroundLoading, displayedTotalCount]);

  useEffect(() => {
    let goalSub: NDKSubscription | null = null;
    let profileSub: NDKSubscription | null = null;

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

            if (IS_DEV) {
              console.log(`🔍 Subscribing to data for ${goalEventIds.length} goals`);
              console.log(`📋 Sample goal event IDs:`, goalEventIds.slice(0, 5));
            }

            // ==================================================
            // Subscribe to Zaps (Kind 9735)
            // ==================================================
            // Filter zaps by goal event IDs using #e tag
            // This means: "Get all zap receipts that reference these goal IDs"
            const allZapsFilter: NDKFilter = {
        kinds: [9735 as any],
        '#e': goalEventIds,
        limit: 10000 // Increased limit to catch all zaps for our goals
      };
      const testZapSub = ndk.subscribe(allZapsFilter, { closeOnEose: true });

      let zapCount = 0;
      let zapsByGoalCount: Record<string, number> = {};

      testZapSub.on('event', (event: NDKEvent) => {
        zapCount++;
        const zap = parseZap9735(event);
        if (IS_DEV && zapCount <= 3) {
          console.log(`⚡ Sample zap #${zapCount}:`, {
            eventId: event.id,
            targetEventId: zap?.targetEventId,
            amount: zap?.amountMsat,
            tags: event.tags.filter(t => t[0] === 'e' || t[0] === 'p').slice(0, 3)
          });
        }
        if (zap) {
          dispatch(addZap(zap));
          if (zap.targetEventId) {
            zapsByGoalCount[zap.targetEventId] = (zapsByGoalCount[zap.targetEventId] || 0) + 1;
          }
        }
      });

      testZapSub.on('eose', () => {
        const goalsWithZaps = Object.keys(zapsByGoalCount).length;
        const totalAmount = Object.values(store.getState().zaps.zapsByGoal)
          .flat()
          .reduce((sum, zap) => sum + Math.floor(zap.amountMsat / 1000), 0);
        
        if (IS_DEV) {
          console.log(`⚡ ${zapCount} zaps loaded for ${goalsWithZaps} goals`);
          console.log(`💰 Total raised across all goals: ${totalAmount.toLocaleString()} sats`);
          console.log('📊 Zaps per goal:', zapsByGoalCount);
        }
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

    subscribeToEvents();

    return () => {
      if (IS_DEV) console.log('🧹 Cleaning up subscriptions');
      goalSub?.stop();
      profileSub?.stop();
    };
  }, []);

  return {
    initialLoading,
    backgroundLoading,
    displayedTotalCount,
    frozenGoals,
  };
};
