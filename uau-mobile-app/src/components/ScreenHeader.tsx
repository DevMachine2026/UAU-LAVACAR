import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  }

  return (
    <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
      <Pressable
        className="mb-3 flex-row items-center gap-1 self-start"
        hitSlop={12}
        onPress={handleBack}
      >
        <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.9)" />
        <Text className="text-sm font-medium text-white/90">Voltar</Text>
      </Pressable>
      <Text className="text-2xl font-bold text-white">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-white/80">{subtitle}</Text> : null}
    </View>
  );
}
