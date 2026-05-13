"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { DataTable } from "@/features/crud/DataTable";
import { FormField, MoneyInput } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { StatusBadge } from "@/features/crud/StatusBadge";
import { errorMessage } from "@/features/crud/feedback";
import {
  PlanItem,
  PlanVehicleSizePrice,
  createPlan,
  createPlanVehicleSizePrice,
  getPlanVehicleSizePrices,
  getPlans,
  setPlanActive,
  setPlanVehicleSizePriceActive,
  updatePlan,
  updatePlanVehicleSizePrice,
} from "@/features/plans/plans.api";
import { getCities, getStates, getUnits } from "@/features/locations/locations.api";
import { getVehicleSizeCategories } from "@/features/vehicle-sizes/vehicleSizes.api";

type PlanForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  useVehicleSizePricing: boolean;
  coverageType: "UNIT" | "CITY" | "STATE" | "NATIONAL";
  allowAllDays: boolean;
  maxVehicles: string;
  allowedStartTime: string;
  allowedEndTime: string;
  stateId: string;
  cityId: string;
  unitId: string;
};

type PriceForm = { id?: string; sizeCategoryId: string; price: string; isActive: boolean };

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"single" | "sizes">("single");
  const [planForm, setPlanForm] = useState<PlanForm | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [priceForm, setPriceForm] = useState<PriceForm | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<PlanItem | null>(null);
  const [confirmPrice, setConfirmPrice] = useState<PlanVehicleSizePrice | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const plans = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const categories = useQuery({ queryKey: ["vehicle-size-categories"], queryFn: getVehicleSizeCategories });
  const states = useQuery({ queryKey: ["states"], queryFn: getStates });
  const cities = useQuery({ queryKey: ["cities"], queryFn: getCities });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const sizePrices = useQuery({
    queryKey: ["plan-size-prices", selectedPlanId],
    queryFn: () => getPlanVehicleSizePrices(selectedPlanId),
    enabled: Boolean(selectedPlanId),
  });

  const selectedPlan = useMemo(
    () => (plans.data ?? []).find((plan) => plan.id === selectedPlanId) ?? null,
    [plans.data, selectedPlanId],
  );

  const savePlan = useMutation({
    mutationFn: () => {
      if (!planForm) throw new Error("Plano nao selecionado");
      const payload = {
        name: planForm.name,
        description: planForm.description || undefined,
        price: Number(planForm.price || 0),
        useVehicleSizePricing: planForm.useVehicleSizePricing,
        coverageType: planForm.coverageType,
        allowAllDays: planForm.allowAllDays,
        maxVehicles: Number(planForm.maxVehicles || 1),
        allowedStartTime: planForm.allowedStartTime || undefined,
        allowedEndTime: planForm.allowedEndTime || undefined,
        availabilities: buildAvailabilities(planForm),
      };
      return planForm.id ? updatePlan(planForm.id, payload) : createPlan(payload);
    },
    onSuccess: () => done("Plano atualizado.", () => setPlanForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const togglePlan = useMutation({
    mutationFn: () => {
      if (!confirmPlan) throw new Error("Plano nao selecionado");
      return setPlanActive(confirmPlan.id, confirmPlan.isActive === false);
    },
    onSuccess: () => done("Status do plano atualizado.", () => setConfirmPlan(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const saveSizePrice = useMutation({
    mutationFn: () => {
      if (!priceForm || !selectedPlanId) throw new Error("Preco incompleto");
      const payload = {
        sizeCategoryId: priceForm.sizeCategoryId,
        price: Number(priceForm.price || 0),
        isActive: priceForm.isActive,
      };
      return priceForm.id
        ? updatePlanVehicleSizePrice(selectedPlanId, priceForm.id, payload)
        : createPlanVehicleSizePrice(selectedPlanId, payload);
    },
    onSuccess: () => done("Preco por porte salvo.", () => setPriceForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggleSizePrice = useMutation({
    mutationFn: () => {
      if (!confirmPrice) throw new Error("Preco nao selecionado");
      return setPlanVehicleSizePriceActive(selectedPlanId, confirmPrice.id, confirmPrice.isActive === false);
    },
    onSuccess: () => done("Preco por porte atualizado.", () => setConfirmPrice(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["plans"] });
    void queryClient.invalidateQueries({ queryKey: ["plan-size-prices", selectedPlanId] });
  }

  const categoryOptions = (categories.data ?? []).map((category) => ({ label: category.name, value: category.id }));
  const planOptions = (plans.data ?? []).map((plan) => ({ label: plan.name, value: plan.id }));
  const stateOptions = (states.data ?? []).map((state) => ({ label: state.name, value: state.id }));
  const cityOptions = (cities.data ?? []).filter((city) => !planForm?.stateId || city.stateId === planForm.stateId).map((city) => ({ label: city.name, value: city.id }));
  const unitOptions = (units.data ?? []).filter((unit) => !planForm?.cityId || unit.cityId === planForm.cityId).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Planos">
        <div className="space-y-6">
          {(plans.isLoading || categories.isLoading || states.isLoading || cities.isLoading || units.isLoading) ? <LoadingState /> : null}
          {(plans.error || categories.error || error) ? <ErrorState message={error || "Nao foi possivel carregar planos."} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTab("single")} variant={tab === "single" ? "primary" : "ghost"}>Preco unico</Button>
            <Button onClick={() => setTab("sizes")} variant={tab === "sizes" ? "primary" : "ghost"}>Preco por porte</Button>
          </div>

          {tab === "single" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setPlanForm(emptyPlanForm())}>Novo plano</Button></div>
              <DataTable
                rows={plans.data ?? []}
                columns={[
                  { header: "Plano", cell: (row) => row.name },
                  { header: "Preco", cell: (row) => formatMoney(row.price) },
                  { header: "Cobertura", cell: (row) => row.coverageType },
                  { header: "Porte", cell: (row) => <StatusBadge active={row.useVehicleSizePricing} label={row.useVehicleSizePricing ? "Por porte" : "Preco unico"} /> },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setPlanForm(toPlanForm(row))}
                onToggle={(row) => setConfirmPlan(row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <SelectField label="Plano" options={planOptions} value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} />
                {selectedPlan ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-uau-black">{selectedPlan.name}</p>
                      <p className="text-sm text-uau-gray">Preco base {formatMoney(selectedPlan.price)} · {selectedPlan.useVehicleSizePricing ? "preco por porte ativo" : "preco unico ativo"}</p>
                    </div>
                    <Button onClick={() => setPlanForm(toPlanForm(selectedPlan))} variant="ghost">Editar modo de preco</Button>
                  </div>
                ) : null}
              </Card>

              {selectedPlanId ? (
                <>
                  <div className="flex justify-end">
                    <Button onClick={() => setPriceForm({ sizeCategoryId: "", price: "", isActive: true })}>Novo preco por porte</Button>
                  </div>
                  {sizePrices.isLoading ? <LoadingState /> : null}
                  <DataTable
                    rows={sizePrices.data ?? []}
                    columns={[
                      { header: "Porte", cell: (row) => row.sizeCategory?.name ?? "-" },
                      { header: "Preco", cell: (row) => formatMoney(row.price) },
                      { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                    ]}
                    onEdit={(row) => setPriceForm({ id: row.id, sizeCategoryId: row.sizeCategoryId, price: String(row.price), isActive: row.isActive !== false })}
                    onToggle={(row) => setConfirmPrice(row)}
                    toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
                  />
                </>
              ) : null}
            </div>
          )}

          {planForm ? (
            <FormModal title={planForm.id ? "Editar plano" : "Novo plano"} onClose={() => setPlanForm(null)} onSubmit={() => savePlan.mutate()} busy={savePlan.isPending}>
              <FormField label="Nome" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} />
              <FormField label="Descricao" value={planForm.description} onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })} />
              <MoneyInput label="Preco unico" value={planForm.price} onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })} />
              <SelectField
                label="Modo de preco"
                options={[
                  { label: "Preco unico", value: "false" },
                  { label: "Preco por porte", value: "true" },
                ]}
                value={String(planForm.useVehicleSizePricing)}
                onChange={(event) => setPlanForm({ ...planForm, useVehicleSizePricing: event.target.value === "true" })}
              />
              <SelectField
                label="Cobertura"
                options={["UNIT", "CITY", "STATE", "NATIONAL"].map((value) => ({ label: value, value }))}
                value={planForm.coverageType}
                onChange={(event) => setPlanForm({ ...planForm, coverageType: event.target.value as PlanForm["coverageType"] })}
              />
              {planForm.coverageType !== "NATIONAL" ? (
                <>
                  <SelectField label="Estado" options={stateOptions} value={planForm.stateId} onChange={(event) => setPlanForm({ ...planForm, stateId: event.target.value, cityId: "", unitId: "" })} />
                  {(planForm.coverageType === "CITY" || planForm.coverageType === "UNIT") ? (
                    <SelectField label="Cidade" options={cityOptions} value={planForm.cityId} onChange={(event) => setPlanForm({ ...planForm, cityId: event.target.value, unitId: "" })} />
                  ) : null}
                  {planForm.coverageType === "UNIT" ? (
                    <SelectField label="Unidade" options={unitOptions} value={planForm.unitId} onChange={(event) => setPlanForm({ ...planForm, unitId: event.target.value })} />
                  ) : null}
                </>
              ) : null}
              <FormField label="Maximo de veiculos" min="1" type="number" value={planForm.maxVehicles} onChange={(event) => setPlanForm({ ...planForm, maxVehicles: event.target.value })} />
              <FormField label="Horario inicio" placeholder="06:00" value={planForm.allowedStartTime} onChange={(event) => setPlanForm({ ...planForm, allowedStartTime: event.target.value })} />
              <FormField label="Horario fim" placeholder="22:00" value={planForm.allowedEndTime} onChange={(event) => setPlanForm({ ...planForm, allowedEndTime: event.target.value })} />
            </FormModal>
          ) : null}

          {priceForm ? (
            <FormModal title={priceForm.id ? "Editar preco por porte" : "Novo preco por porte"} onClose={() => setPriceForm(null)} onSubmit={() => saveSizePrice.mutate()} busy={saveSizePrice.isPending}>
              <SelectField label="Porte" options={categoryOptions} value={priceForm.sizeCategoryId} onChange={(event) => setPriceForm({ ...priceForm, sizeCategoryId: event.target.value })} />
              <MoneyInput label="Preco" value={priceForm.price} onChange={(event) => setPriceForm({ ...priceForm, price: event.target.value })} />
            </FormModal>
          ) : null}

          {confirmPlan ? (
            <ConfirmDialog
              title={confirmPlan.isActive === false ? "Ativar plano" : "Desativar plano"}
              message={`Confirma ${confirmPlan.isActive === false ? "ativar" : "desativar"} ${confirmPlan.name}?`}
              confirmLabel={confirmPlan.isActive === false ? "Ativar" : "Desativar"}
              onCancel={() => setConfirmPlan(null)}
              onConfirm={() => togglePlan.mutate()}
            />
          ) : null}

          {confirmPrice ? (
            <ConfirmDialog
              title={confirmPrice.isActive === false ? "Ativar preco" : "Desativar preco"}
              message={`Confirma ${confirmPrice.isActive === false ? "ativar" : "desativar"} este preco por porte?`}
              confirmLabel={confirmPrice.isActive === false ? "Ativar" : "Desativar"}
              onCancel={() => setConfirmPrice(null)}
              onConfirm={() => toggleSizePrice.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function toPlanForm(plan: PlanItem): PlanForm {
  const availability = (Array.isArray(plan.availabilities) ? plan.availabilities[0] : {}) as { stateId?: string; cityId?: string; unitId?: string };
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    price: String(plan.price ?? 0),
    useVehicleSizePricing: plan.useVehicleSizePricing === true,
    coverageType: plan.coverageType,
    allowAllDays: plan.allowAllDays ?? true,
    maxVehicles: String(plan.maxVehicles ?? 1),
    allowedStartTime: plan.allowedStartTime ?? "",
    allowedEndTime: plan.allowedEndTime ?? "",
    stateId: availability?.stateId ?? "",
    cityId: availability?.cityId ?? "",
    unitId: availability?.unitId ?? "",
  };
}

function emptyPlanForm(): PlanForm {
  return {
    id: "",
    name: "",
    description: "",
    price: "0",
    useVehicleSizePricing: false,
    coverageType: "UNIT",
    allowAllDays: true,
    maxVehicles: "1",
    allowedStartTime: "",
    allowedEndTime: "",
    stateId: "",
    cityId: "",
    unitId: "",
  };
}

function buildAvailabilities(plan: PlanForm) {
  if (plan.coverageType === "NATIONAL") return undefined;
  if (plan.coverageType === "STATE") return [{ stateId: plan.stateId, isActive: true }];
  if (plan.coverageType === "CITY") return [{ stateId: plan.stateId, cityId: plan.cityId, isActive: true }];
  return [{ stateId: plan.stateId, cityId: plan.cityId, unitId: plan.unitId, isActive: true }];
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}
