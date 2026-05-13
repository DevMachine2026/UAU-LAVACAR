"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { DataTable } from "@/features/crud/DataTable";
import { FormField } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { StatusBadge } from "@/features/crud/StatusBadge";
import { errorMessage } from "@/features/crud/feedback";
import {
  CityItem,
  StateItem,
  UnitItem,
  createCity,
  createState,
  createUnit,
  getCities,
  getStates,
  getUnits,
  setCityActive,
  setStateActive,
  setUnitActive,
  updateCity,
  updateState,
  updateUnit,
} from "@/features/locations/locations.api";

type StateForm = { id?: string; name: string; code: string; isActive: boolean };
type CityForm = { id?: string; name: string; stateId: string; isActive: boolean };
type UnitForm = {
  id?: string; name: string; stateId: string; cityId: string; address: string; neighborhood: string; zipCode: string;
  latitude: string; longitude: string; franchiseOwnerName: string; isOwnedUnit: boolean; isFranchiseUnit: boolean; isActive: boolean;
};

const emptyState: StateForm = { name: "", code: "", isActive: true };
const emptyCity: CityForm = { name: "", stateId: "", isActive: true };
const emptyUnit: UnitForm = { name: "", stateId: "", cityId: "", address: "", neighborhood: "", zipCode: "", latitude: "", longitude: "", franchiseOwnerName: "", isOwnedUnit: false, isFranchiseUnit: true, isActive: true };

export default function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"states" | "cities" | "units">("states");
  const [stateForm, setStateForm] = useState<StateForm | null>(null);
  const [cityForm, setCityForm] = useState<CityForm | null>(null);
  const [unitForm, setUnitForm] = useState<UnitForm | null>(null);
  const [confirm, setConfirm] = useState<{ type: "state" | "city" | "unit"; id: string; active: boolean; name: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const states = useQuery({ queryKey: ["states"], queryFn: getStates });
  const cities = useQuery({ queryKey: ["cities"], queryFn: getCities });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });

  const stateOptions = (states.data ?? []).map((item) => ({ label: item.name, value: item.id }));
  const cityOptions = (cities.data ?? [])
    .filter((city) => !unitForm?.stateId || city.stateId === unitForm.stateId)
    .map((item) => ({ label: item.name, value: item.id }));

  const saveState = useMutation({
    mutationFn: () => stateForm?.id
      ? updateState(stateForm.id, { name: stateForm.name, code: stateForm.code.toUpperCase(), isActive: stateForm.isActive })
      : createState({ name: stateForm?.name ?? "", code: (stateForm?.code ?? "").toUpperCase(), isActive: stateForm?.isActive ?? true }),
    onSuccess: () => done("Estado salvo.", () => setStateForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const saveCity = useMutation({
    mutationFn: () => cityForm?.id
      ? updateCity(cityForm.id, { name: cityForm.name, stateId: cityForm.stateId, isActive: cityForm.isActive })
      : createCity({ name: cityForm?.name ?? "", stateId: cityForm?.stateId ?? "", isActive: cityForm?.isActive ?? true }),
    onSuccess: () => done("Cidade salva.", () => setCityForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const saveUnit = useMutation({
    mutationFn: () => {
      if (!unitForm) throw new Error("Unidade incompleta");
      const payload = {
        name: unitForm.name,
        stateId: unitForm.stateId,
        cityId: unitForm.cityId,
        address: unitForm.address,
        neighborhood: unitForm.neighborhood,
        zipCode: unitForm.zipCode,
        latitude: unitForm.latitude ? Number(unitForm.latitude) : undefined,
        longitude: unitForm.longitude ? Number(unitForm.longitude) : undefined,
        franchiseOwnerName: unitForm.franchiseOwnerName || undefined,
        isOwnedUnit: unitForm.isOwnedUnit,
        isFranchiseUnit: unitForm.isFranchiseUnit,
        isActive: unitForm.isActive,
      };
      return unitForm.id ? updateUnit(unitForm.id, payload) : createUnit(payload);
    },
    onSuccess: () => done("Unidade salva.", () => setUnitForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!confirm) return null;
      if (confirm.type === "state") return setStateActive(confirm.id, confirm.active);
      if (confirm.type === "city") return setCityActive(confirm.id, confirm.active);
      return setUnitActive(confirm.id, confirm.active);
    },
    onSuccess: () => done("Status atualizado.", () => setConfirm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["states"] });
    void queryClient.invalidateQueries({ queryKey: ["cities"] });
    void queryClient.invalidateQueries({ queryKey: ["units"] });
  }

  function ask(type: "state" | "city" | "unit", row: { id: string; name: string; isActive?: boolean }) {
    setConfirm({ type, id: row.id, active: row.isActive === false, name: row.name });
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Locations">
        <div className="space-y-6">
          {(states.isLoading || cities.isLoading || units.isLoading) ? <LoadingState /> : null}
          {(states.error || cities.error || units.error || error) ? <ErrorState message={error || "Nao foi possivel carregar localidades."} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTab("states")} variant={tab === "states" ? "primary" : "ghost"}>Estados</Button>
            <Button onClick={() => setTab("cities")} variant={tab === "cities" ? "primary" : "ghost"}>Cidades</Button>
            <Button onClick={() => setTab("units")} variant={tab === "units" ? "primary" : "ghost"}>Unidades</Button>
          </div>

          {tab === "states" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setStateForm(emptyState)}>Novo estado</Button></div>
              <DataTable<StateItem>
                rows={states.data ?? []}
                columns={[
                  { header: "Estado", cell: (row) => row.name },
                  { header: "UF", cell: (row) => row.code },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setStateForm({ id: row.id, name: row.name, code: row.code, isActive: row.isActive !== false })}
                onToggle={(row) => ask("state", row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          ) : null}

          {tab === "cities" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setCityForm(emptyCity)}>Nova cidade</Button></div>
              <DataTable<CityItem>
                rows={cities.data ?? []}
                columns={[
                  { header: "Cidade", cell: (row) => row.name },
                  { header: "Estado", cell: (row) => row.state?.name ?? states.data?.find((state) => state.id === row.stateId)?.name ?? "-" },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setCityForm({ id: row.id, name: row.name, stateId: row.stateId, isActive: row.isActive !== false })}
                onToggle={(row) => ask("city", row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          ) : null}

          {tab === "units" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setUnitForm(emptyUnit)}>Nova unidade</Button></div>
              <DataTable<UnitItem>
                rows={units.data ?? []}
                columns={[
                  { header: "Unidade", cell: (row) => row.name },
                  { header: "Cidade", cell: (row) => row.city?.name ?? cities.data?.find((city) => city.id === row.cityId)?.name ?? "-" },
                  { header: "Endereco", cell: (row) => `${row.address}, ${row.neighborhood}` },
                  { header: "Tipo", cell: (row) => row.isOwnedUnit ? "Propria" : row.isFranchiseUnit ? "Franquia" : "-" },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setUnitForm({
                  id: row.id,
                  name: row.name,
                  stateId: row.stateId,
                  cityId: row.cityId,
                  address: row.address,
                  neighborhood: row.neighborhood,
                  zipCode: row.zipCode,
                  latitude: row.latitude == null ? "" : String(row.latitude),
                  longitude: row.longitude == null ? "" : String(row.longitude),
                  franchiseOwnerName: row.franchiseOwnerName ?? "",
                  isOwnedUnit: row.isOwnedUnit === true,
                  isFranchiseUnit: row.isFranchiseUnit === true,
                  isActive: row.isActive !== false,
                })}
                onToggle={(row) => ask("unit", row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          ) : null}

          {stateForm ? (
            <FormModal title={stateForm.id ? "Editar estado" : "Novo estado"} onClose={() => setStateForm(null)} onSubmit={() => saveState.mutate()} busy={saveState.isPending}>
              <FormField label="Nome" value={stateForm.name} onChange={(event) => setStateForm({ ...stateForm, name: event.target.value })} />
              <FormField label="UF" maxLength={2} value={stateForm.code} onChange={(event) => setStateForm({ ...stateForm, code: event.target.value.toUpperCase() })} />
            </FormModal>
          ) : null}

          {cityForm ? (
            <FormModal title={cityForm.id ? "Editar cidade" : "Nova cidade"} onClose={() => setCityForm(null)} onSubmit={() => saveCity.mutate()} busy={saveCity.isPending}>
              <FormField label="Nome" value={cityForm.name} onChange={(event) => setCityForm({ ...cityForm, name: event.target.value })} />
              <SelectField label="Estado" options={stateOptions} value={cityForm.stateId} onChange={(event) => setCityForm({ ...cityForm, stateId: event.target.value })} />
            </FormModal>
          ) : null}

          {unitForm ? (
            <FormModal title={unitForm.id ? "Editar unidade" : "Nova unidade"} onClose={() => setUnitForm(null)} onSubmit={() => saveUnit.mutate()} busy={saveUnit.isPending}>
              <FormField label="Nome" value={unitForm.name} onChange={(event) => setUnitForm({ ...unitForm, name: event.target.value })} />
              <SelectField label="Estado" options={stateOptions} value={unitForm.stateId} onChange={(event) => setUnitForm({ ...unitForm, stateId: event.target.value, cityId: "" })} />
              <SelectField label="Cidade" options={cityOptions} value={unitForm.cityId} onChange={(event) => setUnitForm({ ...unitForm, cityId: event.target.value })} />
              <FormField label="Endereco" value={unitForm.address} onChange={(event) => setUnitForm({ ...unitForm, address: event.target.value })} />
              <FormField label="Bairro" value={unitForm.neighborhood} onChange={(event) => setUnitForm({ ...unitForm, neighborhood: event.target.value })} />
              <FormField label="CEP" value={unitForm.zipCode} onChange={(event) => setUnitForm({ ...unitForm, zipCode: event.target.value })} />
              <FormField label="Proprietario/franqueado" value={unitForm.franchiseOwnerName} onChange={(event) => setUnitForm({ ...unitForm, franchiseOwnerName: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Latitude" type="number" value={unitForm.latitude} onChange={(event) => setUnitForm({ ...unitForm, latitude: event.target.value })} />
                <FormField label="Longitude" type="number" value={unitForm.longitude} onChange={(event) => setUnitForm({ ...unitForm, longitude: event.target.value })} />
              </div>
              <SelectField label="Tipo" options={[{ label: "Franquia", value: "franchise" }, { label: "Propria", value: "owned" }]} value={unitForm.isOwnedUnit ? "owned" : "franchise"} onChange={(event) => setUnitForm({ ...unitForm, isOwnedUnit: event.target.value === "owned", isFranchiseUnit: event.target.value === "franchise" })} />
            </FormModal>
          ) : null}

          {confirm ? (
            <ConfirmDialog
              title={confirm.active ? "Ativar registro" : "Desativar registro"}
              message={`Confirma ${confirm.active ? "ativar" : "desativar"} ${confirm.name}?`}
              confirmLabel={confirm.active ? "Ativar" : "Desativar"}
              onCancel={() => setConfirm(null)}
              onConfirm={() => toggle.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
