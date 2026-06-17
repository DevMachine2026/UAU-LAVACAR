import "@/theme/global.css";
import { Ionicons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ToastProvider } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="referrals" />
          <Stack.Screen name="partners" />
          <Stack.Screen name="vehicles" />
          <Stack.Screen name="history" />
        </Stack>
      </ToastProvider>
    </QueryClientProvider>
  );
}
