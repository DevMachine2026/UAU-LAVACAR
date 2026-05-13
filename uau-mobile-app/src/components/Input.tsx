import { Text, TextInput, TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-uau-black">{label}</Text>
      <TextInput
        className="h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-uau-black"
        placeholderTextColor="#98A2B3"
        {...props}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
