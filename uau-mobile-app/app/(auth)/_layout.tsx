import { Redirect, Stack } from "expo-router";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/auth/auth.store";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#009688" } }} />;
}
