import { Redirect } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { useAuthStore } from "@/auth/auth.store";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require("../assets/splash-new.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/(auth)/login"} />;
}
