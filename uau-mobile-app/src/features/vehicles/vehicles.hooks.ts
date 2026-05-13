import { useMutation, useQuery } from "@tanstack/react-query";
import {
  activateVehicle,
  createVehicle,
  deactivateVehicle,
  getVehicles,
  setPrimaryVehicle,
  updateVehicle,
  CreateVehiclePayload,
  UpdateVehiclePayload
} from "@/features/vehicles/vehicles.api";

export function useVehicles() {
  return useQuery({ queryKey: ["vehicles", "me"], queryFn: getVehicles });
}

export function useCreateVehicle() {
  return useMutation({ mutationFn: (payload: CreateVehiclePayload) => createVehicle(payload) });
}

export function useUpdateVehicle() {
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: UpdateVehiclePayload }) => updateVehicle(id, payload) });
}

export function useActivateVehicle() {
  return useMutation({ mutationFn: (id: string) => activateVehicle(id) });
}

export function useDeactivateVehicle() {
  return useMutation({ mutationFn: (id: string) => deactivateVehicle(id) });
}

export function useSetPrimaryVehicle() {
  return useMutation({ mutationFn: (id: string) => setPrimaryVehicle(id) });
}
