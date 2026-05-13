import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Vehicle } from "@/features/vehicles/vehicles.api";
import { asRecord, getString } from "@/utils/data";

type VehicleCardProps = {
  vehicle: Vehicle;
  loading?: boolean;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onSetPrimary: () => void;
};

export function VehicleCard({ vehicle, loading = false, onEdit, onActivate, onDeactivate, onSetPrimary }: VehicleCardProps) {
  const record = asRecord(vehicle);
  const isPrimary = Boolean(record.isPrimary ?? record.primary);
  const isActive = vehicle.isActive !== false;
  const details = [getString(record, ["brand", "make"]), getString(record, ["model"]), getString(record, ["color"])]
    .filter(Boolean)
    .join(" - ");

  return (
    <Card>
      <View className="gap-4">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-uau-black">{vehicle.plate}</Text>
            {details ? <Text className="mt-1 text-sm text-uau-gray">{details}</Text> : null}
          </View>
          <View className="items-end gap-1">
            <Text className={`text-xs font-bold ${isActive ? "text-uau-green" : "text-red-600"}`}>
              {isActive ? "Ativo" : "Inativo"}
            </Text>
            {isPrimary ? <Text className="text-xs font-bold text-uau-black">Principal</Text> : null}
          </View>
        </View>

        <View className="gap-2">
          <Button loading={loading} onPress={onEdit} title="Editar" variant="ghost" />
          {isActive ? (
            <Button loading={loading} onPress={onDeactivate} title="Desativar" variant="ghost" />
          ) : (
            <Button loading={loading} onPress={onActivate} title="Ativar" variant="ghost" />
          )}
          {!isPrimary ? <Button loading={loading} onPress={onSetPrimary} title="Definir como principal" /> : null}
        </View>
      </View>
    </Card>
  );
}
