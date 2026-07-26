import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DEFAULT_LESSON_IMAGE, LessonListItem, type LessonStatus } from "@/components/LessonListItem";
import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { units } from "@/data/units";
import { useLanguageStore } from "@/store/useLanguageStore";
import { colors } from "@/theme";
import type { Lesson } from "@/types/learning";

// How many lessons in the current unit are treated as already finished,
// so the screen always has a mix of completed / in-progress / locked
// rows to show. There's no real per-lesson progress tracking yet — this
// is mock status data, per the "no locking logic for now" requirement.
const MOCK_COMPLETED_COUNT = 2;

export default function Learn() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState<"lessons" | "practice">("lessons");
  const [isSaved, setIsSaved] = useState(false);

  if (!selectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  const language = languages.find((lang) => lang.code === selectedLanguage)!;

  const currentUnit = units
    .filter((unit) => unit.languageCode === selectedLanguage)
    .sort((a, b) => a.order - b.order)[0];

  const unitLessons = currentUnit
    ? currentUnit.lessonIds
        .map((id) => lessons.find((lesson) => lesson.id === id))
        .filter((lesson): lesson is Lesson => Boolean(lesson))
        .sort((a, b) => a.order - b.order)
    : [];

  // Lesson content only exists for a subset of the languages offered on the
  // language-selection screen (see data/units.ts). Show a friendly empty
  // state instead of crashing for the rest.
  if (!currentUnit || unitLessons.length === 0) {
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

  const completedCount = Math.min(MOCK_COMPLETED_COUNT, unitLessons.length - 1);
  const currentLessonIndex = completedCount;
  const currentLesson = unitLessons[currentLessonIndex];

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  const openLesson = (lesson: Lesson) => {
    posthog.capture("lesson_opened", { lessonId: lesson.id });
    router.push({ pathname: "/learn/[id]", params: { id: lesson.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <View className="px-6 pt-2">
        <Pressable onPress={goBack} hitSlop={8} className="self-start">
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>

        <View className="flex-row items-start justify-between mt-1">
          <View className="flex-1 pr-3">
            <Text className="h3" numberOfLines={1}>
              {currentLesson.title}
            </Text>
            <Text className="body-sm text-text-secondary mt-1">
              Unit {currentUnit.order} • {completedCount}/{unitLessons.length} lessons
            </Text>
          </View>

          <Pressable onPress={() => setIsSaved((value) => !value)} hitSlop={8} className="pt-1">
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <Image
        source={{ uri: currentLesson.image ?? DEFAULT_LESSON_IMAGE }}
        style={{ width: "100%", height: 260, marginTop: 16 }}
        resizeMode="cover"
      />

      <View style={[styles.tabBar, { marginTop: -28 }]} className="mx-6 flex-row bg-white rounded-full p-1.5">
        <Pressable onPress={() => setActiveTab("lessons")} className="flex-1 items-center py-2.5">
          <Text
            className={`body-md ${
              activeTab === "lessons" ? "font-poppins-semibold text-lingua-purple" : "text-text-secondary"
            }`}
          >
            Lessons
          </Text>
          {activeTab === "lessons" && <View className="h-0.5 w-10 rounded-full bg-lingua-purple mt-1" />}
        </Pressable>

        <Pressable onPress={() => setActiveTab("practice")} className="flex-1 items-center py-2.5">
          <Text
            className={`body-md ${
              activeTab === "practice" ? "font-poppins-semibold text-lingua-purple" : "text-text-secondary"
            }`}
          >
            Practice
          </Text>
          {activeTab === "practice" && <View className="h-0.5 w-10 rounded-full bg-lingua-purple mt-1" />}
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}>
        {activeTab === "lessons" ? (
          unitLessons.map((lesson, index) => {
            const status: LessonStatus =
              index < completedCount ? "completed" : index === currentLessonIndex ? "in-progress" : "locked";

            return (
              <LessonListItem
                key={lesson.id}
                lesson={lesson}
                status={status}
                totalLessonsInUnit={unitLessons.length}
                onPress={() => openLesson(lesson)}
              />
            );
          })
        ) : (
          <View className="items-center justify-center gap-2 py-20">
            <Ionicons name="barbell-outline" size={40} color={colors.textSecondary} />
            <Text className="body-md-muted text-center">Practice mode coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
