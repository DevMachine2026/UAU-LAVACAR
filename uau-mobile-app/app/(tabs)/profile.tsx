import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <Screen>
      <View className="gap-5">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-uau-black">Perfil</Text>
          <Text className="text-sm text-uau-gray">Seus dados da conta UAU+</Text>
        </View>

        {/* Avatar + dados */}
        <View className="items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-uau-teal">
            <Text className="text-3xl font-bold text-white">{initials}</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-xl font-bold text-uau-black">{user?.name ?? "—"}</Text>
            <Text className="text-sm text-uau-gray">{user?.email ?? "—"}</Text>
            {user?.phone ? <Text className="text-sm text-uau-gray">{user.phone}</Text> : null}
          </View>
          {user?.status ? (
            <View className="rounded-full bg-green-50 px-4 py-1">
              <Text className="text-xs font-semibold text-green-700">{user.status}</Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4">
          <Button onPress={() => void logout()} title="Sair da conta" variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
