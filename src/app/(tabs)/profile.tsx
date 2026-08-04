import { Ionicons } from "@expo/vector-icons";
import { useClerk, useUser } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarPickerModal } from "@/components/AvatarPickerModal";
import { avatars } from "@/data/avatars";
import { languages } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProfileStore } from "@/store/useProfileStore";
import { colors } from "@/theme";

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const avatarId = useProfileStore((state) => state.avatarId);
  const setAvatarId = useProfileStore((state) => state.setAvatarId);

  const [isPickerVisible, setPickerVisible] = useState(false);

  if (!selectedLanguage) {
    return <Redirect href="/language-selection" />;
  }

  const language = languages.find((lang) => lang.code === selectedLanguage)!;
  const selectedAvatar = avatars.find((avatar) => avatar.id === avatarId) ?? avatars[0];
  const fullName = user?.fullName ?? user?.firstName ?? "Learner";
  const email = user?.primaryEmailAddress?.emailAddress;
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <LinearGradient colors={["#FFFFFF", "#F4F0FE"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center px-6 pt-10">
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <Image source={selectedAvatar.image} style={styles.avatarImage} resizeMode="cover" />
            </View>

            <Pressable
              onPress={() => setPickerVisible(true)}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </Pressable>
          </View>

          <Text className="h2 mt-5">{fullName}</Text>
          {email ? <Text className="body-sm text-text-secondary mt-1">{email}</Text> : null}

          <View className="flex-row items-center gap-2 bg-[#F1ECFE] rounded-full px-4 py-2 mt-3">
            <Image source={{ uri: language.flag }} style={styles.flagImage} resizeMode="cover" />
            <Text className="body-md font-poppins-semibold text-lingua-purple">
              Learning {language.name}
            </Text>
          </View>

          {joinedDate ? <Text className="caption mt-2">Joined {joinedDate}</Text> : null}

          <View className="flex-1" />

          <Pressable
            onPress={() => signOut()}
            className="flex-row items-center gap-2 mb-4 px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text className="body-md font-poppins-semibold" style={{ color: colors.error }}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <AvatarPickerModal
        visible={isPickerVisible}
        selectedId={avatarId}
        onSelect={setAvatarId}
        onClose={() => setPickerVisible(false)}
      />
    </LinearGradient>
  );
}

const AVATAR_RING_SIZE = 136;
const AVATAR_IMAGE_SIZE = 120;
const EDIT_BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  avatarWrapper: {
    width: AVATAR_RING_SIZE,
    height: AVATAR_RING_SIZE,
  },
  avatarRing: {
    width: AVATAR_RING_SIZE,
    height: AVATAR_RING_SIZE,
    borderRadius: AVATAR_RING_SIZE / 2,
    backgroundColor: "#EFEAFE",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarImage: {
    width: AVATAR_IMAGE_SIZE,
    height: AVATAR_IMAGE_SIZE,
    borderRadius: AVATAR_IMAGE_SIZE / 2,
  },
  editButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: EDIT_BUTTON_SIZE,
    height: EDIT_BUTTON_SIZE,
    borderRadius: EDIT_BUTTON_SIZE / 2,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0D132B",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  flagImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
