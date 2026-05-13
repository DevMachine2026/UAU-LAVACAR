import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ManualAttendancePayload } from "@/features/operator/operator.api";

const TYPES: ManualAttendancePayload["type"][] = ["PLAN", "AVULSO", "COURTESY", "PARTNER", "BLOCKED", "UNKNOWN"];
const PAYMENTS = ["NONE", "PIX", "CREDIT_CARD", "CASHBACK"];

type AttendanceFormProps = {
  shiftId: string;
  loading?: boolean;
  onSubmit: (payload: ManualAttendancePayload) => void;
};

export function AttendanceForm({ shiftId, loading = false, onSubmit }: AttendanceFormProps) {
  const [plate, setPlate] = useState("");
  const [type, setType] = useState<ManualAttendancePayload["type"]>("AVULSO");
  const [paymentMethod, setPaymentMethod] = useState<ManualAttendancePayload["paymentMethod"] | "NONE">("PIX");
  const [amountPaid, setAmountPaid] = useState("");
  const [cashbackUsed, setCashbackUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function parseMoney(value: string) {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function submit() {
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!normalizedPlate) {
      setError("Informe a placa.");
      return;
    }
    setError(null);
    onSubmit({
      shiftId,
      plate: normalizedPlate,
      type,
      paymentMethod: paymentMethod === "NONE" ? undefined : paymentMethod,
      amountPaid: parseMoney(amountPaid),
      cashbackUsed: parseMoney(cashbackUsed),
      notes: notes.trim() || undefined,
      status: type === "BLOCKED" ? "BLOCKED" : "COMPLETED"
    });
    setPlate("");
    setAmountPaid("");
    setCashbackUsed("");
    setNotes("");
  }

  return (
    <Card>
      <View className="gap-4">
        <Text className="text-xl font-bold text-uau-black">Registrar carro</Text>
        <Input
          autoCapitalize="characters"
          error={error ?? undefined}
          label="Placa"
          onChangeText={(value) => setPlate(value.toUpperCase())}
          placeholder="ABC1D23"
          value={plate}
        />
        <PickerRow items={TYPES} selected={type} onSelect={(value) => setType(value as ManualAttendancePayload["type"])} />
        <PickerRow items={PAYMENTS} selected={paymentMethod} onSelect={(value) => setPaymentMethod(value as typeof paymentMethod)} />
        <Input keyboardType="decimal-pad" label="Valor pago" onChangeText={setAmountPaid} placeholder="0,00" value={amountPaid} />
        <Input keyboardType="decimal-pad" label="Cashback usado" onChangeText={setCashbackUsed} placeholder="0,00" value={cashbackUsed} />
        <Input label="Observacoes" onChangeText={setNotes} value={notes} />
        <Button loading={loading} onPress={submit} title="Registrar atendimento" />
      </View>
    </Card>
  );
}

function PickerRow({ items, selected, onSelect }: { items: string[]; selected?: string; onSelect: (value: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <Pressable
          className={`min-h-10 justify-center rounded-lg px-3 ${selected === item ? "bg-uau-green" : "bg-uau-light"}`}
          key={item}
          onPress={() => onSelect(item)}
        >
          <Text className={`text-xs font-bold ${selected === item ? "text-white" : "text-uau-black"}`}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}
