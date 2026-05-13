import { ActivityIndicator, View } from "react-native";

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#0BA95B" />
    </View>
  );
}
