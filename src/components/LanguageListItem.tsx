import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { colors } from "@/theme";
import type { Language } from "@/types/learning";

type LanguageListItemProps = {
  language: Language;
  selected: boolean;
  onPress: () => void;
};

// Row used on the language selection screen. Shows a filled checkmark
// circle when selected, otherwise a chevron to invite a tap.
export function LanguageListItem({ language, selected, onPress }: LanguageListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
        selected ? "border-2 border-lingua-purple bg-indigo-50" : "border-border bg-white"
      }`}
    >
      <View className="w-12 h-12 rounded-full overflow-hidden bg-surface">
        <Image source={{ uri: language.flag }} className="w-full h-full" resizeMode="cover" />
      </View>

      <View className="flex-1">
        <Text className="h4">{language.name}</Text>
        <Text className="body-sm text-text-secondary">{language.learners} learners</Text>
      </View>

      {selected ? (
        <View className="w-6 h-6 rounded-full bg-lingua-purple items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}
