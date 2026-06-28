import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "@/auth/auth.store";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return <View style={{ flex: 1, backgroundColor: "#009688" }} />;
  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/(auth)/login"} />;
}
