import { ReactNode } from "react";
import { Pressable, Text } from "react-native";

type SocialButtonProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
};

// Bordered pill button used for "continue with" social auth options.
export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-3 border border-border rounded-2xl py-4"
    >
      {icon}
      <Text className="body-lg font-poppins-medium">{label}</Text>
    </Pressable>
  );
}
