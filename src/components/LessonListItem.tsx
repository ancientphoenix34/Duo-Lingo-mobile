import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { colors } from "@/theme";
import type { Lesson } from "@/types/learning";

export const DEFAULT_LESSON_IMAGE = "https://picsum.photos/seed/lingua-lesson/600/400";

export type LessonStatus = "completed" | "in-progress" | "locked";

type LessonListItemProps = {
  lesson: Lesson;
  status: LessonStatus;
  totalLessonsInUnit: number;
  onPress: () => void;
};

// Single row on the unit's lessons screen. Shows a green check for
// completed lessons, a highlighted card with the lesson's own image for
// the current lesson, and a lock icon for lessons still ahead.
export function LessonListItem({ lesson, status, totalLessonsInUnit, onPress }: LessonListItemProps) {
  const isCurrent = status === "in-progress";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 mb-3 ${
        isCurrent ? "border-2 border-lingua-purple bg-indigo-50" : "border-border bg-white"
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className={`body-sm ${isCurrent ? "text-lingua-purple" : "text-text-secondary"}`}>
          Lesson {lesson.order}
        </Text>
        <Text className={`h4 ${isCurrent ? "text-lingua-purple" : ""}`}>{lesson.title}</Text>

        {isCurrent && <Text className="caption text-lingua-purple mt-1">In progress</Text>}
        {status === "locked" && (
          <Text className="caption text-text-secondary mt-1">0 / {totalLessonsInUnit} lessons</Text>
        )}
      </View>

      {status === "completed" && (
        <View className="w-9 h-9 rounded-full bg-success items-center justify-center">
          <Ionicons name="checkmark" size={18} color="#ffffff" />
        </View>
      )}

      {isCurrent && (
        <Image
          source={{ uri: lesson.image ?? DEFAULT_LESSON_IMAGE }}
          style={{ width: 52, height: 52, borderRadius: 14 }}
          resizeMode="cover"
        />
      )}

      {status === "locked" && <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />}
    </Pressable>
  );
}
