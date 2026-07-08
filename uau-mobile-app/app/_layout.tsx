import "@/theme/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ToastProvider } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";
import * as Sentry from "@sentry/react-native";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: false,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  });
}

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession().then(() => {
      void SplashScreen.hideAsync();
    });
  }, [restoreSession]);

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
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default sentryDsn ? Sentry.wrap(RootLayout) : RootLayout;
