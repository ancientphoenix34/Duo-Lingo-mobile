import { useSignIn, useSSO } from "@clerk/expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthTextField } from "@/components/AuthTextField";
import { SocialButton } from "@/components/SocialButton";
import { VerificationModal } from "@/components/VerificationModal";
import { images } from "@/constants/images";
import { colors } from "@/theme";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // This screen only collects an email, so sign-in is passwordless: a
  // one-time code is emailed and confirmed in the VerificationModal below.
  const handleSignIn = async () => {
    const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (!error) setIsVerifying(true);
  };

  const handleVerify = async (code: string) => {
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) return error.longMessage ?? error.message;

    if (signIn.status !== "complete") {
      return "We couldn't finish signing you in. Please try again.";
    }

    await signIn.finalize();
    return null;
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google" });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/onboarding"))}
            hitSlop={8}
            className="mt-2 self-start"
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>

          <Text className="h1 mt-4">Welcome back</Text>
          <Text className="body-md-muted mt-2">Continue your language journey ✨</Text>

          <View className="items-center my-6">
            <View className="relative items-center justify-center" style={{ width: 200, height: 160 }}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#FFC800"
                style={{ position: "absolute", top: 6, left: 10 }}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={14}
                color="#4D8BFF"
                style={{ position: "absolute", top: 34, right: 4 }}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={12}
                color="#6C4EF5"
                style={{ position: "absolute", bottom: 12, right: 24 }}
              />
              <Image source={images.mascotAuth} style={{ width: 190, height: 150 }} resizeMode="contain" />
            </View>
          </View>

          <View className="gap-4">
            <AuthTextField
              label="Email"
              placeholder="alex@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            {errors.fields.identifier && (
              <Text className="body-sm text-error -mt-2">
                {errors.fields.identifier.longMessage ?? errors.fields.identifier.message}
              </Text>
            )}
          </View>

          <Pressable
            className="items-center justify-center bg-lingua-purple rounded-full py-5 mt-6"
            style={{
              // experimental_backgroundImage isn't expressible via NativeWind arbitrary values
              experimental_backgroundImage: "linear-gradient(to right, #6C4EF5 0%, #8B7CF7 100%)",
            }}
            onPress={handleSignIn}
            disabled={fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching" ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-poppins-semibold">Sign In</Text>
            )}
          </Pressable>

          {errors.global && errors.global.length > 0 && (
            <Text className="body-sm text-error text-center mt-3">
              {errors.global[0].longMessage ?? errors.global[0].message}
            </Text>
          )}

          <View className="flex-row items-center gap-3 my-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="body-sm text-text-secondary">or continue with</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <View className="gap-3">
            <SocialButton
              label="Continue with Google"
              icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
              onPress={handleGoogleSignIn}
            />
            <SocialButton
              label="Continue with Facebook"
              icon={<Ionicons name="logo-facebook" size={20} color="#1877F2" />}
            />
            <SocialButton
              label="Continue with Apple"
              icon={<Ionicons name="logo-apple" size={22} color="#000000" />}
            />
          </View>

          <View className="flex-row items-center justify-center gap-1 mt-8">
            <Text className="body-md text-text-secondary">Don&apos;t have an account?</Text>
            <Link href="/sign-up" replace>
              <Text className="body-md font-poppins-semibold text-lingua-purple">Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <VerificationModal
        visible={isVerifying}
        email={email || "your email"}
        onClose={() => setIsVerifying(false)}
        onVerify={handleVerify}
      />
    </SafeAreaView>
  );
}
