// Design tokens mirrored in global.css `@theme` so the same values
// are available in NativeWind classNames (e.g. `bg-primary`) and in
// plain TS/StyleSheet code (Style Exception components, icons, etc).

export const colors = {
  // Brand / primary palette
  primary: "#6C4EF5", // Lingua Purple
  primaryDeep: "#5B3BF6", // Lingua Deep Purple
  primaryBlue: "#4D8BFF", // Lingua Blue
  primaryGreen: "#21C16B", // Lingua Green

  // Semantic colors
  success: "#21C16B",
  warning: "#FFC800",
  streak: "#FF8A00",
  error: "#FF4D4F",
  info: "#4D8BFF",

  // Neutrals
  textPrimary: "#0D132B",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  surface: "#F6F7FB",
  background: "#FFFFFF",
} as const;

export type ColorToken = keyof typeof colors;
