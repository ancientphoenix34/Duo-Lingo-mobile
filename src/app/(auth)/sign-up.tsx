import { useSignUp, useSSO } from "@clerk/expo";
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

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSignUp = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (!codeError) setIsVerifying(true);
  };

  const handleVerify = async (code: string) => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return error.longMessage ?? error.message;

    if (signUp.status !== "complete") {
      return "We couldn't finish creating your account. Please try again.";
    }

    await signUp.finalize();
    return null;
  };

  const handleGoogleSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google" });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google sign-up failed:", err);
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

          <Text className="h1 mt-4">Create your account</Text>
          <Text className="body-md-muted mt-2">Start your language journey today ✨</Text>

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
            {errors.fields.emailAddress && (
              <Text className="body-sm text-error -mt-2">
                {errors.fields.emailAddress.longMessage ?? errors.fields.emailAddress.message}
              </Text>
            )}
            <AuthTextField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {errors.fields.password && (
              <Text className="body-sm text-error -mt-2">
                {errors.fields.password.longMessage ?? errors.fields.password.message}
              </Text>
            )}
          </View>

          <Pressable
            className="items-center justify-center bg-lingua-purple rounded-full py-5 mt-6"
            style={{
              // experimental_backgroundImage isn't expressible via NativeWind arbitrary values
              experimental_backgroundImage: "linear-gradient(to right, #6C4EF5 0%, #8B7CF7 100%)",
            }}
            onPress={handleSignUp}
            disabled={fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching" ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-poppins-semibold">Sign Up</Text>
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
              onPress={handleGoogleSignUp}
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
            <Text className="body-md text-text-secondary">Already have an account?</Text>
            <Link href="/sign-in" replace>
              <Text className="body-md font-poppins-semibold text-lingua-purple">Log in</Text>
            </Link>
          </View>

          {/* Invisible on native; required by Clerk's bot sign-up protection */}
          <View nativeID="clerk-captcha" />
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
