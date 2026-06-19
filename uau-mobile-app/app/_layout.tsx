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
      // Sem plugin nativo (app.json removido), loadAsync não tem conflito de nome 'Ionicons' vs 'ionicons'.
      // Timeout de 5s só para fonte — sessão sempre é aguardada completamente.
      await Promise.all([
        Promise.race([
          Font.loadAsync(Ionicons.font),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error("font timeout")), 5000)),
        ]).catch(() => { /* se font falhar, app continua sem ícones */ }),
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
