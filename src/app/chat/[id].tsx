import { ThemedText } from "@/components/themed-text";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const ChatByIdScreen = () => {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <ThemedText>ChatID: </ThemedText>
      <ThemedText>{id}</ThemedText>
    </View>
  );
};
export default ChatByIdScreen;
