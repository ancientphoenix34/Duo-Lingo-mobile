import "../../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect } from "react";

import { StreamVideoProvider } from "@/components/StreamVideoProvider";
import { fontAssets } from "@/constants/fonts";
import { posthogApiKey, posthogHost } from "@/lib/posthog";
import { useLanguageStore } from "@/store/useLanguageStore";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{ host: posthogHost, captureAppLifecycleEvents: true }}
      autocapture={{ captureScreens: false, captureTouches: false }}
      debug
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <RootNavigation />
      </ClerkProvider>
    </PostHogProvider>
  );
}

// Waits for Clerk to resolve the signed-in state and for the language
// store to finish reading AsyncStorage before revealing any screen, so the
// route guards below land on the right screen immediately instead of
// flashing onboarding/home before redirecting (or vice versa).
function RootNavigation() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const hasLanguage = useLanguageStore((state) => state.selectedLanguage !== null);
  const posthog = usePostHog();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded, hasHydrated]);

  // expo-router doesn't use @react-navigation/native under the hood (SDK 57),
  // so PostHog's built-in navigation autocapture can't see route changes —
  // track screen views manually off the current pathname instead.
  useEffect(() => {
    posthog.screen(pathname);
  }, [pathname, posthog]);

  if (!isLoaded || !hasHydrated) {
    return null;
  }

  const stack = (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        {/* Registering the tabs only once a language exists is what keeps a
            first-run sign-in off the home screen entirely. Guarding inside
            (tabs)/index instead would mount the tab bar and paint an empty
            shell for a beat before the redirect could fire. */}
        <Stack.Protected guard={hasLanguage}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="language-selection" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );

  // Only the signed-in stack needs a Stream Video connection - keep it
  // mounted for the whole authenticated session so screen transitions don't
  // tear down and reconnect the WebSocket.
  return isSignedIn ? <StreamVideoProvider>{stack}</StreamVideoProvider> : stack;
}
