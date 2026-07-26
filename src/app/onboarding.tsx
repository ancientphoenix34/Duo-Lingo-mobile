import { router, Stack } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpeechBubble } from "@/components/SpeechBubble";
import { images } from "@/constants/images";

export default function Onboarding() {
  const posthog = usePostHog();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-center gap-2 mt-2">
          <Image
            source={images.mascotLogo}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-poppins-bold text-text-primary">muolingo</Text>
        </View>

        <View className="mt-10">
          <Text className="h1">
            Your AI language <Text className="text-lingua-purple">teacher.</Text>
          </Text>
          <Text className="body-md-muted mt-3">
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        <View className="flex-1 relative items-center justify-center mt-8">
          <SpeechBubble
            text="Hello!"
            className="top-4 left-2 bg-slate-100"
            textClassName="text-slate-800"
          />

          <View className="relative" style={{ width: 340, height: 340 }}>
            <SpeechBubble
              text="¡Hola!"
              className="top-14 -right-6 bg-indigo-50"
              textClassName="text-indigo-600"
            />
            <SpeechBubble
              text="你好!"
              className="bottom-10 -right-8 bg-orange-50"
              textClassName="text-red-500"
            />
            <Image
              source={images.mascotWelcome}
              style={{ width: 380, height: 380 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <Pressable
          onPress={() => {
            posthog.capture("onboarding_get_started_tapped");
            router.push("/sign-up");
          }}
          className="relative items-center justify-center bg-lingua-purple rounded-full py-5 mb-6"
        >
          <Text className="text-white text-lg font-poppins-semibold">Get Started</Text>
          <Text className="absolute right-6 text-white text-xl font-poppins-bold">
            {"›"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
