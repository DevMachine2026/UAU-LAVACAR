import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { CreateVehiclePayload, Vehicle } from "@/features/vehicles/vehicles.api";
import { maskLicensePlate, unmaskLicensePlate } from "@/utils/masks";

type VehicleFormProps = {
  vehicle?: Vehicle | null;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: CreateVehiclePayload) => void;
};

export function VehicleForm({ vehicle, loading = false, onCancel, onSubmit }: VehicleFormProps) {
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlate(maskLicensePlate(vehicle?.plate ?? ""));
    setBrand((vehicle?.brand ?? vehicle?.make ?? "") as string);
    setModel((vehicle?.model ?? "") as string);
    setColor((vehicle?.color ?? "") as string);
    setError(null);
  }, [vehicle]);

  function submit() {
    const normalizedPlate = unmaskLicensePlate(plate);

    if (!normalizedPlate) {
      setError("Informe a placa do veiculo.");
      return;
    }

    setError(null);
    onSubmit({
      plate: normalizedPlate,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      color: color.trim() || undefined
    });
  }

  return (
    <Card>
      <View className="gap-4">
        <Text className="text-xl font-bold text-uau-black">{vehicle ? "Editar veiculo" : "Cadastrar veiculo"}</Text>
        <Input
          autoCapitalize="characters"
          autoCorrect={false}
          error={error ?? undefined}
          label="Placa"
          maxLength={8}
          onChangeText={(text) => setPlate(maskLicensePlate(text))}
          placeholder="ABC-1D23"
          returnKeyType="next"
          value={plate}
        />
        <Input autoCapitalize="words" label="Marca" onChangeText={setBrand} placeholder="Ex: Toyota" returnKeyType="next" value={brand} />
        <Input autoCapitalize="words" label="Modelo" onChangeText={setModel} placeholder="Ex: Corolla" returnKeyType="next" value={model} />
        <Input autoCapitalize="words" label="Cor" onChangeText={setColor} placeholder="Ex: Prata" returnKeyType="done" value={color} />
        <Button loading={loading} onPress={submit} title={vehicle ? "Salvar alterações" : "Adicionar veículo"} />
        {onCancel ? <Button onPress={onCancel} title="Cancelar" variant="ghost" /> : null}
      </View>
    </Card>
  );
}
