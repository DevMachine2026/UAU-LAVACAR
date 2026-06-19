import "@/theme/global.css";
import { Ionicons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // Aguarda fonts carregarem; fallback de 2s evita splash eterna se asset falhar
  useEffect(() => {
    if (fontsLoaded) { setFontReady(true); return; }
    const t = setTimeout(() => setFontReady(true), 2000);
    return () => clearTimeout(t);
  }, [fontsLoaded]);

  useEffect(() => {
    if (!isLoading && fontReady) void SplashScreen.hideAsync();
  }, [isLoading, fontReady]);

  if (isLoading || !fontReady) {
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
