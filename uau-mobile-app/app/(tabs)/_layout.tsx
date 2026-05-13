import { Redirect, Tabs } from "expo-router";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/auth/auth.store";

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0BA95B",
        tabBarInactiveTintColor: "#667085"
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="wallet" options={{ title: "Cashback" }} />
      <Tabs.Screen name="billing" options={{ title: "Cobrancas" }} />
      <Tabs.Screen name="partners" options={{ title: "Parceiros" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
