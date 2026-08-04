import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_AVATAR_ID } from "@/data/avatars";
import type { AvatarId } from "@/data/avatars";

interface ProfileState {
  avatarId: AvatarId;
  hasHydrated: boolean;
  setAvatarId: (avatarId: AvatarId) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      avatarId: DEFAULT_AVATAR_ID,
      hasHydrated: false,
      setAvatarId: (avatarId) => set({ avatarId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ avatarId: state.avatarId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
