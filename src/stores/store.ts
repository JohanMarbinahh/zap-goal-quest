import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import relaysReducer from './relaysSlice';
import profilesReducer from './profilesSlice';
import goalsReducer from './goalsSlice';
import zapsReducer from './zapsSlice';
import contactsReducer from './contactsSlice';
import reactionsReducer from './reactionsSlice';

const authPersistConfig = {
  key: 'zapgoal-auth',
  storage,
};

const relaysPersistConfig = {
  key: 'zapgoal-relays',
  storage,
  version: 1,
  migrate: (state: any) => {
    // Force cleanup to only 10 relays
    if (state && state.relays && state.relays.length > 10) {
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://nostr.wine',
        'wss://relay.primal.net',
        'wss://nos.lol',
        'wss://relay.snort.social',
        'wss://relay.nostr.band',
        'wss://eden.nostr.land',
        'wss://nostr.fmt.wiz.biz',
        'wss://relay.orangepill.dev',
        'wss://nostr-pub.wellorder.net',
      ];
      return {
        ...state,
        relays: DEFAULT_RELAYS,
        relayStatuses: [],
      };
    }
    return state;
  },
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedRelaysReducer = persistReducer(relaysPersistConfig, relaysReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    relays: persistedRelaysReducer,
    profiles: profilesReducer,
    goals: goalsReducer,
    zaps: zapsReducer,
    contacts: contactsReducer,
    reactions: reactionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        warnAfter: 128, // Increase warning threshold for large states
      },
      immutableCheck: {
        warnAfter: 128,
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
