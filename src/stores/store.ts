import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import relaysReducer from './relaysSlice';
import profilesReducer from './profilesSlice';
import goalsReducer from './goalsSlice';
import zapsReducer from './zapsSlice';
import reactionsReducer from './reactionsSlice';
import commentsReducer from './commentsSlice';
import updatesReducer from './updatesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    relays: relaysReducer,
    profiles: profilesReducer,
    goals: goalsReducer,
    zaps: zapsReducer,
    reactions: reactionsReducer,
    comments: commentsReducer,
    updates: updatesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
