import type { ImageSourcePropType } from "react-native";

import { images } from "@/constants/images";

// Preset profile pictures the user can pick from on the Profile screen.
// The "fox-*" avatars reuse the app's existing mascot artwork; the rest
// are cartoon animal avatars for extra variety.
export type AvatarId = "fox-wave" | "fox-walk" | "fox-peek" | "bear" | "tiger" | "deer" | "panda" | "lion";

export interface ProfileAvatar {
  id: AvatarId;
  image: ImageSourcePropType;
}

export const avatars: ProfileAvatar[] = [
  { id: "fox-wave", image: images.mascotAuth },
  { id: "fox-walk", image: images.mascotWelcome },
  { id: "fox-peek", image: images.mascotLogo },
  { id: "bear", image: images.avatarBear },
  { id: "tiger", image: images.avatarTiger },
  { id: "deer", image: images.avatarDeer },
  { id: "panda", image: images.avatarPanda },
  { id: "lion", image: images.avatarLion },
];

export const DEFAULT_AVATAR_ID: AvatarId = "fox-wave";
