import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen>
      <View className="gap-5">
        <Text className="text-3xl font-bold text-uau-black">Perfil</Text>
        <Card>
          <Text className="text-lg font-semibold text-uau-black">{user?.name}</Text>
          <Text className="mt-1 text-sm text-uau-gray">{user?.email}</Text>
          <Text className="mt-1 text-sm text-uau-gray">Role: {user?.role}</Text>
          {user?.status ? <Text className="mt-1 text-sm text-uau-gray">Status: {user.status}</Text> : null}
          {user?.phone ? <Text className="mt-1 text-sm text-uau-gray">Telefone: {user.phone}</Text> : null}
        </Card>
        <Button onPress={() => void logout()} title="Sair" variant="ghost" />
      </View>
    </Screen>
  );
}
