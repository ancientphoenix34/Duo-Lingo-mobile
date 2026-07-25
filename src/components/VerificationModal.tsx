import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  // Returns an error message on failure, or null on success.
  onVerify: (code: string) => Promise<string | null>;
};

// Bottom-sheet modal for entering the 6-digit email verification code.
// Digits are typed into an off-screen TextInput and mirrored into the
// visible boxes below, which keeps backspace/paste handling simple.
export function VerificationModal({ visible, email, onClose, onVerify }: VerificationModalProps) {
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
          {visible && <CodeEntry onVerify={onVerify} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Isolated so mounting it fresh each time the modal opens resets the
// code state, instead of resetting it with setState inside an effect.
function CodeEntry({ onVerify }: { onVerify: (code: string) => Promise<string | null> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleChangeCode = async (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);

    if (digits.length === CODE_LENGTH) {
      setIsSubmitting(true);
      const errorMessage = await onVerify(digits);
      setIsSubmitting(false);

      if (errorMessage) {
        setError(errorMessage);
        setCode("");
      }
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

      {isSubmitting && (
        <View className="mt-4 items-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {error && <Text className="body-sm text-error text-center mt-4">{error}</Text>}

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeCode}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        editable={!isSubmitting}
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </>
  );
}
