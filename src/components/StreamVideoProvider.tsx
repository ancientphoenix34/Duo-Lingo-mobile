import { StreamVideo, type DeepPartial, type Theme } from "@stream-io/video-react-native-sdk";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStreamVideoConnection } from "@/hooks/useStreamVideoConnection";
import { colors } from "@/theme";

/**
 * Wraps the signed-in stack once near the app root so the Stream Video
 * client and its WebSocket survive screen transitions (see AGENTS.md > AI /
 * Stream / Vision Agent Rules). Bridges safe-area insets into the SDK theme
 * so any Stream call UI respects notches and Android edge-to-edge.
 */
export function StreamVideoProvider({ children }: { children: ReactNode }) {
  const client = useStreamVideoConnection();
  const { top, right, bottom, left } = useSafeAreaInsets();

  if (!client) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // The SDK's own `DeepPartial<Theme>` type doesn't structurally accept a
  // plain insets object in this SDK version (upstream typing issue) - the
  // shape matches the documented `variants.insets` pattern exactly, so this
  // cast just bypasses the broken type, not the actual runtime contract.
  const insetsTheme = { variants: { insets: { top, right, bottom, left } } } as DeepPartial<Theme>;

  return (
    <StreamVideo client={client} style={insetsTheme}>
      {children}
    </StreamVideo>
  );
}
