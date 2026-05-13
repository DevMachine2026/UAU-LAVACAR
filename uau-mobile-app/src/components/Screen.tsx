import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  const content = <View className="flex-1 px-5 py-6">{children}</View>;

  return (
    <View className="flex-1 bg-uau-light">
      <StatusBar style="dark" />
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content}
    </View>
  );
}
