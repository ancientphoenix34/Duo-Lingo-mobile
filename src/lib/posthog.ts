export const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY!;
export const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

if (!posthogApiKey) {
  console.warn("Add EXPO_PUBLIC_POSTHOG_API_KEY to your .env file to enable PostHog analytics");
}
