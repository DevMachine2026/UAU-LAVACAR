import { ActivityIndicator, Pressable, Text } from "react-native";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export function Button({ title, onPress, loading = false, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      className={`h-12 items-center justify-center rounded-lg ${isPrimary ? "bg-uau-green" : "bg-transparent"}`}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : "#0BA95B"} />
      ) : (
        <Text className={`font-semibold ${isPrimary ? "text-white" : "text-uau-green"}`}>{title}</Text>
      )}
    </Pressable>
  );
}
