import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { CloseShiftPayload, ReadingField } from "@/features/operator/operator.api";
import { ReadingFieldsForm } from "@/features/operator/ReadingFieldsForm";

type CloseShiftFormProps = {
  fields: ReadingField[];
  loading?: boolean;
  onSubmit: (payload: CloseShiftPayload) => void;
};

export function CloseShiftForm({ fields, loading = false, onSubmit }: CloseShiftFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [closingNotes, setClosingNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const activeFields = fields.filter((field) => field.isActive !== false);
    const closingReadings = activeFields.map((field) => ({
      fieldId: field.id,
      closingValue: Number((values[field.id] ?? "").replace(",", "."))
    }));
    if (closingReadings.some((reading) => !Number.isFinite(reading.closingValue))) {
      setError("Preencha todas as leituras finais.");
      return;
    }
    setError(null);
    onSubmit({ closingNotes: closingNotes.trim() || undefined, closingReadings });
  }

  return (
    <Card>
      <View className="gap-4">
        <Text className="text-xl font-bold text-uau-black">Fechamento</Text>
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <ReadingFieldsForm
          fields={fields}
          labelPrefix="Leituras finais"
          onChange={(fieldId, value) => setValues((current) => ({ ...current, [fieldId]: value }))}
          values={values}
        />
        <Input label="Observacoes de fechamento" onChangeText={setClosingNotes} value={closingNotes} />
        <Button loading={loading} onPress={submit} title="Fechar expediente" />
      </View>
    </Card>
  );
}
