import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  pubkey: string | null;
  npub: string | null;
  isNip07: boolean;
  ephemeralKey: string | null;
}

const initialState: AuthState = {
  pubkey: null,
  npub: null,
  isNip07: false,
  ephemeralKey: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPubkey: (state, action: PayloadAction<{ pubkey: string; npub: string; isNip07: boolean }>) => {
      state.pubkey = action.payload.pubkey;
      state.npub = action.payload.npub;
      state.isNip07 = action.payload.isNip07;
    },
    setEphemeralKey: (state, action: PayloadAction<string>) => {
      state.ephemeralKey = action.payload;
    },
    logout: (state) => {
      state.pubkey = null;
      state.npub = null;
      state.isNip07 = false;
    },
  },
});

export const { setPubkey, setEphemeralKey, logout } = authSlice.actions;
export default authSlice.reducer;
