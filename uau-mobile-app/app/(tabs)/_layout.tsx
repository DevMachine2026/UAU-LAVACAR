import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Loading } from "@/components/Loading";
import { useAuthStore } from "@/auth/auth.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, icon: IoniconName, iconOutline: IoniconName) {
  return <Ionicons name={focused ? icon : iconOutline} size={24} color={focused ? "#009688" : "#667085"} />;
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { bottom } = useSafeAreaInsets();

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
        tabBarActiveTintColor: "#009688",
        tabBarInactiveTintColor: "#667085",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          height: 64 + bottom,
          paddingTop: 6,
          paddingBottom: 10 + bottom,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => tabIcon(focused, "home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Cashback",
          tabBarIcon: ({ focused }) => tabIcon(focused, "wallet", "wallet-outline"),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Cobranças",
          tabBarIcon: ({ focused }) => tabIcon(focused, "receipt", "receipt-outline"),
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: "Parceiros",
          tabBarIcon: ({ focused }) => tabIcon(focused, "storefront", "storefront-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => tabIcon(focused, "person", "person-outline"),
        }}
      />
    </Tabs>
  );
}
