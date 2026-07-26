import { useClerk, useUser } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, Redirect } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

import { languages } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function Index() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const clearSelectedLanguage = useLanguageStore((state) => state.clearSelectedLanguage);

  if (!selectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  const language = languages.find((lang) => lang.code === selectedLanguage);

  const handleClearStorage = async () => {
    await AsyncStorage.clear();
    clearSelectedLanguage();
  };

  return (
    <View className="flex-1 justify-center items-center gap-6 px-6">
      <Text className="h2 text-center color-lingua-purple">Lingua</Text>
      <Text className="body-md-muted text-center">
        Signed in as {user?.primaryEmailAddress?.emailAddress}
      </Text>
      {language && (
        <View className="flex-row items-center gap-2 bg-surface rounded-full pl-2 pr-4 py-2">
          <View className="w-8 h-8 rounded-full overflow-hidden bg-white">
            <Image source={{ uri: language.flag }} className="w-full h-full" resizeMode="cover" />
          </View>
          <Text className="body-md font-poppins-semibold">Learning {language.name}</Text>
        </View>
      )}
      <Link href="/language-selection" asChild>
        <Pressable className="bg-lingua-purple rounded-full px-6 py-3">
          <Text className="text-white font-poppins-semibold">Choose a language</Text>
        </Pressable>
      </Link>
      <Pressable onPress={() => signOut()} className="bg-lingua-purple rounded-full px-6 py-3">
        <Text className="text-white font-poppins-semibold">Sign out</Text>
      </Pressable>
      <Pressable onPress={handleClearStorage} className="bg-error rounded-full px-6 py-3">
        <Text className="text-white font-poppins-semibold">Clear storage (test)</Text>
      </Pressable>
    </View>
  );
}
