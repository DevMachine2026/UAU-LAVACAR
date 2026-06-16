import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  statusBarStyle?: "light" | "dark" | "auto" | "inverted";
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, scroll = true, statusBarStyle = "dark", refreshing, onRefresh }: ScreenProps) {
  const content = <View className="flex-1 px-5 py-6">{children}</View>;

  return (
    <SafeAreaView className="flex-1 bg-uau-light">
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  colors={["#009688"]}
                  onRefresh={onRefresh}
                  refreshing={refreshing ?? false}
                  tintColor="#009688"
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
