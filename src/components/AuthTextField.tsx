import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

import { colors } from "@/theme";

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
};

// Bordered field with a small label above the value, matching the
// auth screen design. Password fields get a show/hide eye toggle.
export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
}: AuthTextFieldProps) {
  const [isHidden, setIsHidden] = useState(secureTextEntry);

  return (
    <View className="border border-border rounded-2xl px-4 pt-2 pb-3">
      <Text className="caption text-text-secondary">{label}</Text>
      <View className="flex-row items-center">
        <TextInput
          className="flex-1 body-lg py-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isHidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsHidden((hidden) => !hidden)} hitSlop={8}>
            <Ionicons
              name={isHidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
