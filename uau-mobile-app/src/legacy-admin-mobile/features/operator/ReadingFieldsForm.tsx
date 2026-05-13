import { Text, View } from "react-native";
import { Input } from "@/components/Input";
import { ReadingField } from "@/features/operator/operator.api";

type ReadingFieldsFormProps = {
  fields: ReadingField[];
  values: Record<string, string>;
  labelPrefix: string;
  onChange: (fieldId: string, value: string) => void;
};

export function ReadingFieldsForm({ fields, values, labelPrefix, onChange }: ReadingFieldsFormProps) {
  const activeFields = fields.filter((field) => field.isActive !== false);

  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-uau-black">{labelPrefix}</Text>
      {activeFields.map((field) => (
        <Input
          key={field.id}
          keyboardType="decimal-pad"
          label={field.name}
          onChangeText={(value) => onChange(field.id, value)}
          placeholder="0"
          value={values[field.id] ?? ""}
        />
      ))}
    </View>
  );
}
