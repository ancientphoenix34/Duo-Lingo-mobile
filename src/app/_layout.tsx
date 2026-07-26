import "../../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { fontAssets } from "@/constants/fonts";
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
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootNavigation />
    </ClerkProvider>
  );
}

// Waits for Clerk to resolve the signed-in state and for the language
// store to finish reading AsyncStorage before revealing any screen, so the
// route guards below land on the right screen immediately instead of
// flashing onboarding/home before redirecting (or vice versa).
function RootNavigation() {
  const { isLoaded, isSignedIn } = useAuth();
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);

  useEffect(() => {
    if (isLoaded && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded, hasHydrated]);

  if (!isLoaded || !hasHydrated) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language-selection" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
