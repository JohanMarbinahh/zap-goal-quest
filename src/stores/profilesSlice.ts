import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '@/types/nostr';

const initialState = {
  profiles: {},
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<{ pubkey: string; profile: Profile }>) => {
      state.profiles[action.payload.pubkey] = action.payload.profile;
    },
  },
});

export const { setProfile } = profilesSlice.actions;
export default profilesSlice.reducer;
