import { useState } from "react";
import { Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useToast } from "@/components/Toast";
import { VehicleCard } from "@/features/vehicles/VehicleCard";
import { VehicleForm } from "@/features/vehicles/VehicleForm";
import { CreateVehiclePayload, Vehicle } from "@/features/vehicles/vehicles.api";
import {
  useActivateVehicle,
  useCreateVehicle,
  useDeactivateVehicle,
  useSetPrimaryVehicle,
  useUpdateVehicle,
  useVehicles
} from "@/features/vehicles/vehicles.hooks";
import { asArray, asRecord } from "@/utils/data";

function normalizeVehicles(value: unknown) {
  if (Array.isArray(value)) return value as Vehicle[];
  const record = asRecord(value);
  return asArray<Vehicle>(record.items ?? record.data);
}

export default function VehiclesScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const vehiclesQuery = useVehicles();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const activateMutation = useActivateVehicle();
  const deactivateMutation = useDeactivateVehicle();
  const primaryMutation = useSetPrimaryVehicle();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vehicles = normalizeVehicles(vehiclesQuery.data);
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    primaryMutation.isPending;

  async function refreshVehicles(message: string) {
    await queryClient.invalidateQueries({ queryKey: ["vehicles", "me"] });
    setError(null);
    toast.show(message, "success");
  }

  async function submitVehicle(payload: CreateVehiclePayload) {
    try {
      if (editingVehicle) {
        await updateMutation.mutateAsync({ id: editingVehicle.id, payload });
        setEditingVehicle(null);
        await refreshVehicles("Veiculo atualizado com sucesso.");
        return;
      }

      await createMutation.mutateAsync(payload);
      await refreshVehicles("Veiculo cadastrado com sucesso.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível salvar o veículo.";
      setError(msg);
      toast.show(msg, "error");
    }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      await refreshVehicles(message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível executar a ação.";
      setError(msg);
      toast.show(msg, "error");
    }
  }

  return (
    <Screen statusBarStyle="light">
      <View className="gap-6 pb-6">
        <ScreenHeader
          title="Meus Veículos"
          subtitle="Gerencie as placas vinculadas à sua assinatura."
        />

        {vehiclesQuery.isLoading ? <Loading /> : null}
        {vehiclesQuery.error ? <ErrorState message="Não foi possível carregar seus veículos agora." /> : null}
        {error ? <ErrorState title="Atenção" message={error} /> : null}

        <VehicleForm
          loading={isMutating}
          onCancel={editingVehicle ? () => setEditingVehicle(null) : undefined}
          onSubmit={(payload) => void submitVehicle(payload)}
          vehicle={editingVehicle}
        />

        <View className="gap-3">
          <Text className="text-xl font-bold text-uau-black">Cadastrados</Text>
          {vehicles.length === 0 && !vehiclesQuery.isLoading ? (
            <EmptyState title="Nenhum veiculo cadastrado" description="Cadastre sua placa para usar no checkout e nas unidades." />
          ) : null}
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              loading={isMutating}
              onActivate={() => void runAction(() => activateMutation.mutateAsync(vehicle.id), "Veiculo ativado.")}
              onDeactivate={() => void runAction(() => deactivateMutation.mutateAsync(vehicle.id), "Veiculo desativado.")}
              onEdit={() => {
                setEditingVehicle(vehicle);
                setError(null);
              }}
              onSetPrimary={() => void runAction(() => primaryMutation.mutateAsync(vehicle.id), "Veiculo principal atualizado.")}
              vehicle={vehicle}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}
