import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import relaysReducer from './relaysSlice';
import profilesReducer from './profilesSlice';
import goalsReducer from './goalsSlice';
import zapsReducer from './zapsSlice';

const authPersistConfig = {
  key: 'zapgoal-auth',
  storage,
};

const relaysPersistConfig = {
  key: 'zapgoal-relays',
  storage,
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
