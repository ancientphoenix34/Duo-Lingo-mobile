import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center gap-6">
      <Text className="h2 text-center color-lingua-purple">
        Lingua
      </Text>
      <Link href="/onboarding" className="bg-lingua-purple rounded-full px-6 py-3">
        <Text className="text-white font-poppins-semibold">View Onboarding</Text>
      </Link>
    </View>
  );
}
