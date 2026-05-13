import { Redirect } from "expo-router";
import { useAuthStore } from "@/auth/auth.store";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? "/(tabs)/home" : "/(auth)/login"} />;
}
