import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Zap9735 } from '@/types/nostr';

interface ZapsState {
  zapsByGoal: Record<string, Zap9735[]>;
  zapsByPubkey: Record<string, Zap9735[]>;
}

const initialState: ZapsState = {
  zapsByGoal: {},
  zapsByPubkey: {},
};

const zapsSlice = createSlice({
  name: 'zaps',
  initialState,
  reducers: {
    addZap: (state, action: PayloadAction<Zap9735>) => {
      const zap = action.payload;
      
      if (zap.targetEventId) {
        if (!state.zapsByGoal[zap.targetEventId]) {
          state.zapsByGoal[zap.targetEventId] = [];
        }
        const exists = state.zapsByGoal[zap.targetEventId].some(z => z.eventId === zap.eventId);
        if (!exists) {
          state.zapsByGoal[zap.targetEventId].push(zap);
        }
      }
      
      if (zap.recipientPubkey) {
        if (!state.zapsByPubkey[zap.recipientPubkey]) {
          state.zapsByPubkey[zap.recipientPubkey] = [];
        }
        const exists = state.zapsByPubkey[zap.recipientPubkey].some(z => z.eventId === zap.eventId);
        if (!exists) {
          state.zapsByPubkey[zap.recipientPubkey].push(zap);
        }
      }
    },
  },
});

export const { addZap } = zapsSlice.actions;
export default zapsSlice.reducer;
