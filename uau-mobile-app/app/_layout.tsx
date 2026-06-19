import "@/theme/global.css";
import { Ionicons } from "@expo/vector-icons";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // Carrega fonte e sessão em paralelo; timeout de 3s evita trava se asset falhar
      await Promise.all([
        Promise.race([
          Font.loadAsync(Ionicons.font),
          new Promise<void>((resolve) => setTimeout(resolve, 3000)),
        ]).catch(() => {}),
        restoreSession(),
      ]);
      setAppReady(true);
    }
    void prepare();
  }, [restoreSession]);

  useEffect(() => {
    if (appReady) void SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

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
