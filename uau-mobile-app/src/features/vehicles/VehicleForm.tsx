import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { CreateVehiclePayload, Vehicle } from "@/features/vehicles/vehicles.api";

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
    setPlate(vehicle?.plate ?? "");
    setBrand((vehicle?.brand ?? vehicle?.make ?? "") as string);
    setModel((vehicle?.model ?? "") as string);
    setColor((vehicle?.color ?? "") as string);
    setError(null);
  }, [vehicle]);

  function submit() {
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");

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
          error={error ?? undefined}
          label="Placa"
          onChangeText={(value) => setPlate(value.toUpperCase())}
          placeholder="ABC1D23"
          value={plate}
        />
        <Input label="Marca" onChangeText={setBrand} value={brand} />
        <Input label="Modelo" onChangeText={setModel} value={model} />
        <Input label="Cor" onChangeText={setColor} value={color} />
        <Button loading={loading} onPress={submit} title={vehicle ? "Salvar alteracoes" : "Adicionar veiculo"} />
        {onCancel ? <Button onPress={onCancel} title="Cancelar" variant="ghost" /> : null}
      </View>
    </Card>
  );
}
