import { Stack } from "expo-router";

// Nested stack so the lesson detail screen pushes on top of the lessons
// list while staying inside the Learn tab — the shared CustomTabBar (from
// the parent Tabs navigator) stays visible and keeps "Learn" highlighted.
export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
