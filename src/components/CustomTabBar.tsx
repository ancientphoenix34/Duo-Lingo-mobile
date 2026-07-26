import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: "home", inactive: "home-outline" },
  learn: { active: "book", inactive: "book-outline" },
  "ai-teacher": { active: "hardware-chip", inactive: "hardware-chip-outline" },
  chat: { active: "chatbubble", inactive: "chatbubble-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const ROW_HEIGHT = 66;
const ICON_SIZE = 24;
const CIRCLE_SIZE = 46;
const CIRCLE_TOP = 0;

// Custom tab bar with a sliding active-tab indicator. The indicator's
// x-position is driven by a linear timing animation (no spring overshoot)
// so it glides evenly between tabs, while its vertical placement is a fixed
// constant (rather than flex-centered) so it lines up with the icon
// regardless of whether the inactive label below it is visible.
export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const tabWidth = width / state.routes.length;

  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withTiming(state.index, { duration: 250, easing: Easing.linear });
  }, [state.index, activeIndex]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: activeIndex.value * tabWidth + (tabWidth - CIRCLE_SIZE) / 2 }],
    }),
    [tabWidth],
  );

  return (
    <View
      className="bg-white border-t border-border"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View className="flex-row" style={{ height: ROW_HEIGHT }}>
        <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none" />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const icon = TAB_ICONS[route.name] ?? TAB_ICONS.index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              className="flex-1 items-center justify-center gap-1"
            >
              <Ionicons
                name={isFocused ? icon.active : icon.inactive}
                size={ICON_SIZE}
                color={isFocused ? "#FFFFFF" : colors.textSecondary}
              />
              <Text className="caption" style={{ opacity: isFocused ? 0 : 1 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: CIRCLE_TOP,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
