import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TodayPlanItem } from "@/components/TodayPlanItem";
import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { units } from "@/data/units";
import { useLanguageStore } from "@/store/useLanguageStore";
import type { LanguageCode } from "@/types/learning";

// Casual greeting word shown per language while a fuller localization
// system isn't in place yet.
const GREETINGS: Record<LanguageCode, string> = {
  es: "Hola",
  fr: "Salut",
  ja: "こんにちは",
  ko: "안녕",
  de: "Hallo",
  zh: "你好",
};

// Placeholder portrait for the AI teacher until a real mascot/avatar asset
// is added to assets/images.
const AI_TEACHER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80";

// Placeholder streak count until streak tracking is implemented in Zustand.
const STREAK_COUNT = 12;
const DAILY_GOAL_XP = 20;

export default function Index() {
  const { user } = useUser();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

  if (!selectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  const language = languages.find((lang) => lang.code === selectedLanguage)!;

  const currentUnit = units
    .filter((unit) => unit.languageCode === selectedLanguage)
    .sort((a, b) => a.order - b.order)[0];

  const currentLesson = currentUnit
    ? lessons
        .filter((lesson) => lesson.unitId === currentUnit.id)
        .sort((a, b) => a.order - b.order)[0]
    : undefined;

  const firstName = user?.firstName ?? "there";
  const greeting = GREETINGS[selectedLanguage];

  // Lesson content only exists for a subset of the languages offered on the
  // language-selection screen (see data/units.ts). Show a friendly empty
  // state instead of crashing for the rest.
  if (!currentUnit || !currentLesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Image source={images.mascotWelcome} style={{ width: 160, height: 160 }} resizeMode="contain" />
          <Text className="h3 text-center">Lessons coming soon</Text>
          <Text className="body-md-muted text-center">
            We&rsquo;re still building the {language.name} course. Pick another language to keep
            learning today.
          </Text>
          <Pressable
            onPress={() => router.push("/language-selection")}
            className="bg-lingua-purple rounded-full px-6 py-3 mt-2"
          >
            <Text className="text-white font-poppins-semibold">Choose a language</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const earnedXpToday = currentLesson.xpReward;
  const goalProgress = Math.min(earnedXpToday / DAILY_GOAL_XP, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2">
          <Pressable
            onPress={() => router.push("/language-selection")}
            className="flex-row items-center gap-2"
          >
            <View className="w-9 h-9 rounded-full overflow-hidden bg-surface">
              <Image source={{ uri: language.flag }} className="w-full h-full" resizeMode="cover" />
            </View>
            <Text className="h4">
              {greeting}, {firstName}! 👋
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Image source={images.streakFire} style={{ width: 22, height: 22 }} resizeMode="contain" />
              <Text className="h4">{STREAK_COUNT}</Text>
            </View>
            <Ionicons name="notifications-outline" size={24} color="#0D132B" />
          </View>
        </View>

        {/* Daily goal */}
        <View className="flex-row items-center justify-between bg-[#FDF0E4] rounded-3xl px-5 py-4 mt-5">
          <View className="flex-1 gap-2">
            <Text className="body-sm text-text-secondary">Daily goal</Text>
            <Text className="h2">
              {earnedXpToday} <Text className="body-lg text-text-secondary">/ {DAILY_GOAL_XP} XP</Text>
            </Text>
            <View className="h-2 rounded-full bg-[#F6DCC0] overflow-hidden mt-1">
              <View
                className="h-full rounded-full bg-streak"
                style={{ width: `${goalProgress * 100}%` }}
              />
            </View>
          </View>
          <Image source={images.treasure} style={{ width: 84, height: 84 }} resizeMode="contain" />
        </View>

        {/* Continue learning */}
        <Pressable className="rounded-3xl overflow-hidden mt-4">
          <LinearGradient
            colors={["#6C4EF5", "#4D88FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 20, paddingTop: 20 }}
          >
            <Text className="body-md text-white/80">Continue learning</Text>
            <Text className="text-white text-[26px] font-poppins-bold mt-1">{language.name}</Text>
            <Text className="body-md text-white/80 mt-1">
              A{currentUnit.order} • Unit {currentUnit.order}
            </Text>

            <Pressable
              onPress={() => router.push("/(tabs)/learn")}
              className="self-start bg-white rounded-full px-6 py-3 mt-4 mb-5"
            >
              <Text className="text-lingua-purple font-poppins-semibold">Continue</Text>
            </Pressable>

            <Image
              source={images.palace}
              style={{ position: "absolute", right: -8, bottom: -6, width: 160, height: 140 }}
              resizeMode="contain"
            />
          </LinearGradient>
        </Pressable>

        {/* Today's plan */}
        <View className="flex-row items-center justify-between mt-6">
          <Text className="h3">Today&rsquo;s plan</Text>
          <Pressable onPress={() => router.push("/(tabs)/learn")}>
            <Text className="body-md font-poppins-semibold text-lingua-purple">View all</Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <TodayPlanItem
            icon="book"
            iconBackgroundClassName="bg-lingua-purple"
            title="Lesson"
            subtitle={currentLesson.description}
            completed
          />
          <TodayPlanItem
            icon="headset"
            iconBackgroundClassName="bg-lingua-purple"
            title="AI Conversation"
            subtitle={currentLesson.phrases[0]?.translation ?? "Talk about your day"}
            completed={false}
          />
          <TodayPlanItem
            icon="chatbubble-ellipses"
            iconBackgroundClassName="bg-error"
            title="New words"
            subtitle={`${currentLesson.vocabulary.length} words`}
            completed={false}
          />
        </View>

        {/* Next up */}
        <View className="flex-row items-center justify-between bg-[#EDF5E6] rounded-3xl px-5 py-4 mt-5">
          <View className="flex-1 gap-1">
            <Text className="body-sm text-text-secondary">Next up</Text>
            <Text className="h4">AI Video Call</Text>
            <Text className="body-sm text-text-secondary">Practice speaking</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="w-14 h-14 rounded-full overflow-hidden bg-surface">
              <Image source={{ uri: AI_TEACHER_AVATAR }} className="w-full h-full" resizeMode="cover" />
            </View>
            <Pressable className="w-9 h-9 rounded-full bg-lingua-green items-center justify-center">
              <Ionicons name="videocam" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
