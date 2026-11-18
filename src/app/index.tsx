import { ThemedText } from "@/components/themed-text";
import { usePushNotification } from "@/hooks/use-push-notification";
import { Button, FlatList, Text, View } from "react-native";

export default function App() {
  const { expoPushToken, notification, sendPushNotification } =
    usePushNotification();

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "space-around" }}
    >
      <Text>Your Expo push token: {expoPushToken}</Text>

      <FlatList
        data={notification}
        keyExtractor={(item) => item.request.identifier}
        renderItem={({ item }) => (
          <View>
            <ThemedText style={{ fontWeight: "bold" }}>
              {item.request.content.title}
            </ThemedText>
            <ThemedText>{item.request.content.body}</ThemedText>
            <ThemedText>{item.request.content.subtitle}</ThemedText>
            <ThemedText>
              {JSON.stringify(item.request.content.data, null, 2)}
            </ThemedText>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ opacity: 0.5, height: 1, backgroundColor: "grey" }} />
        )}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignContent: "center",
              paddingVertical: 20,
            }}
          >
            <ThemedText>No hay Notificaciones</ThemedText>
          </View>
        )}
      />
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification({
            to: [expoPushToken],
            body: "practicando con hook",
            title: "Lokango 123",
            data: { chatId: "ABC-123" },
          });
        }}
      />
    </View>
  );
}
