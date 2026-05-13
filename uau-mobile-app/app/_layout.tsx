import "@/theme/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/auth/auth.store";
import { queryClient } from "@/store/query-client";

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
