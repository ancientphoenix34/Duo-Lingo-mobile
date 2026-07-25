import { useClerk, useUser } from "@clerk/expo";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View className="flex-1 justify-center items-center gap-6 px-6">
      <Text className="h2 text-center color-lingua-purple">Lingua</Text>
      <Text className="body-md-muted text-center">
        Signed in as {user?.primaryEmailAddress?.emailAddress}
      </Text>
      <Pressable onPress={() => signOut()} className="bg-lingua-purple rounded-full px-6 py-3">
        <Text className="text-white font-poppins-semibold">Sign out</Text>
      </Pressable>
    </View>
  );
}
