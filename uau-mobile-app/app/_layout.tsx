import "@/theme/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { JSSplashScreen } from "@/components/JSSplashScreen";
import { ToastProvider } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    restoreSession().then(() => setAppReady(true));
  }, [restoreSession]);

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="subscribe/index" />
          <Stack.Screen name="referrals/index" />
          <Stack.Screen name="partners/[id]" />
          <Stack.Screen name="vehicles/index" />
          <Stack.Screen name="history/index" />
          <Stack.Screen name="units/index" />
          <Stack.Screen name="units/[id]" />
        </Stack>
        <JSSplashScreen visible={!appReady} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
