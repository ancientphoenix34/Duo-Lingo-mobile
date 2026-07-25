import { Text, View } from "react-native";

type SpeechBubbleProps = {
  text: string;
  className: string;
  textClassName: string;
};

// Small floating chat-bubble used to decorate the onboarding mascot.
// Position, background and text color are passed in per instance since
// each bubble on the screen looks different.
export function SpeechBubble({ text, className, textClassName }: SpeechBubbleProps) {
  return (
    <View className={`absolute rounded-2xl px-4 py-2 shadow-sm ${className}`}>
      <Text className={`text-[15px] font-poppins-medium ${textClassName}`}>{text}</Text>
    </View>
  );
}
