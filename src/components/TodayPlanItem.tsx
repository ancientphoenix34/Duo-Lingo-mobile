import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type TodayPlanItemProps = {
  icon: IoniconName;
  iconBackgroundClassName: string;
  title: string;
  subtitle: string;
  completed: boolean;
};

// Single row in the Home screen's "Today's plan" list: an icon square,
// a title/subtitle pair, and a trailing status circle.
export function TodayPlanItem({
  icon,
  iconBackgroundClassName,
  title,
  subtitle,
  completed,
}: TodayPlanItemProps) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className={`w-11 h-11 rounded-2xl items-center justify-center ${iconBackgroundClassName}`}>
        <Ionicons name={icon} size={20} color="#ffffff" />
      </View>

      <View className="flex-1">
        <Text className="h4">{title}</Text>
        <Text className="body-sm text-text-secondary">{subtitle}</Text>
      </View>

      {completed ? (
        <View className="w-7 h-7 rounded-full bg-lingua-purple items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        </View>
      ) : (
        <View className="w-7 h-7 rounded-full border-2 border-border" />
      )}
    </View>
  );
}
