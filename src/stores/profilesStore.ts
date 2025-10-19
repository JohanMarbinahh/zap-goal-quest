import { create } from 'zustand';
import { Profile } from '@/types/nostr';

interface ProfilesState {
  profiles: Map<string, Profile>;
  setProfile: (pubkey: string, profile: Profile) => void;
  getProfile: (pubkey: string) => Profile | undefined;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: new Map(),
  setProfile: (pubkey, profile) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.set(pubkey, profile);
      return { profiles: newProfiles };
    }),
  getProfile: (pubkey) => get().profiles.get(pubkey),
}));
