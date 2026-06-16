import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  statusBarStyle?: "light" | "dark" | "auto" | "inverted";
}>;

export function Screen({ children, scroll = true, statusBarStyle = "dark" }: ScreenProps) {
  const content = <View className="flex-1 px-5 py-6">{children}</View>;

  return (
    <SafeAreaView className="flex-1 bg-uau-light">
      <StatusBar style={statusBarStyle} />
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}
