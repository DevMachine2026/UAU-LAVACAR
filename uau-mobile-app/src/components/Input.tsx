import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, secureTextEntry, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-uau-black">{label}</Text>
      <View className="flex-row items-center h-12 rounded-lg border border-gray-300 bg-white px-4">
        <TextInput
          className="flex-1 text-base text-uau-black"
          placeholderTextColor="#98A2B3"
          secureTextEntry={secureTextEntry && !visible}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#98A2B3"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
