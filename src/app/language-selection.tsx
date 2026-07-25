import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageListItem } from "@/components/LanguageListItem";
import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { colors } from "@/theme";
import type { LanguageCode } from "@/types/learning";

export default function LanguageSelection() {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<LanguageCode>(languages[0].code);

  const filteredLanguages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return languages.filter((language) => language.name.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-row items-center justify-between px-6 pt-2">
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text className="h3">Choose a language</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center gap-2 bg-surface rounded-full px-4 py-3 mt-5">
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            className="flex-1 body-lg py-0"
            value={query}
            onChangeText={setQuery}
            placeholder="Search languages"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text className="body-lg font-poppins-semibold mt-6 mb-3">Popular</Text>

        <View className="gap-3">
          {filteredLanguages.map((language) => (
            <LanguageListItem
              key={language.code}
              language={language}
              selected={language.code === selectedCode}
              onPress={() => setSelectedCode(language.code)}
            />
          ))}

          {filteredLanguages.length === 0 && (
            <Text className="body-md-muted text-center mt-8">
              No languages found for &ldquo;{query}&rdquo;
            </Text>
          )}
        </View>

        <Pressable
          className="items-center justify-center bg-lingua-purple rounded-full py-5 mt-6"
          onPress={goBack}
        >
          <Text className="text-white text-lg font-poppins-semibold">Confirm</Text>
        </Pressable>

        <Image
          source={images.earth}
          className="mt-8"
          style={{ width: "100%", height: 220 }}
          resizeMode="contain"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
