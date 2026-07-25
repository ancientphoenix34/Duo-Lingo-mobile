import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@/theme";

const CODE_LENGTH = 6;

type VerificationModalProps = {
  visible: boolean;
  email: string;
  onClose: () => void;
};

// Bottom-sheet modal for entering the 6-digit email verification code.
// Digits are typed into an off-screen TextInput and mirrored into the
// visible boxes below, which keeps backspace/paste handling simple.
export function VerificationModal({ visible, email, onClose }: VerificationModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />

        <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10">
          <View className="flex-row justify-end">
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text className="h2 text-center">Check your email</Text>
          <Text className="body-md-muted text-center mt-2 px-2">
            We sent a 6-digit verification code to{"\n"}
            <Text className="font-poppins-semibold text-text-primary">{email}</Text>
          </Text>

          {/* Remounted on every open (via `visible &&`) so the code always starts empty */}
          {visible && <CodeEntry />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Isolated so mounting it fresh each time the modal opens resets the
// code state, instead of resetting it with setState inside an effect.
function CodeEntry() {
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleChangeCode = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(digits);

    if (digits.length === CODE_LENGTH) {
      setTimeout(() => router.replace("/"), 250);
    }
  };

  return (
    <>
      <Pressable
        className="flex-row justify-center gap-2 mt-8"
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
          <View
            key={index}
            className={`w-12 h-14 rounded-2xl border items-center justify-center ${
              index === code.length ? "border-lingua-purple" : "border-border"
            }`}
          >
            <Text className="h3">{code[index] ?? ""}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeCode}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </>
  );
}
