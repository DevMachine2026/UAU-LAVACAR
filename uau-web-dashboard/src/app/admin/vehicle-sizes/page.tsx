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
  VehicleModelSizeRule,
  VehicleSizeCategory,
  createVehicleModelSizeRule,
  createVehicleSizeCategory,
  getVehicleModelSizeRules,
  getVehicleSizeCategories,
  setVehicleModelSizeRuleActive,
  setVehicleSizeCategoryActive,
  updateVehicleModelSizeRule,
  updateVehicleSizeCategory,
} from "@/features/vehicle-sizes/vehicleSizes.api";

type CategoryForm = { id?: string; name: string; description: string; sortOrder: string; isActive: boolean };
type RuleForm = { id?: string; brand: string; model: string; sizeCategoryId: string; isActive: boolean };

const emptyCategory: CategoryForm = { name: "", description: "", sortOrder: "0", isActive: true };
const emptyRule: RuleForm = { brand: "", model: "", sizeCategoryId: "", isActive: true };

export default function VehicleSizesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"categories" | "rules">("categories");
  const [categoryForm, setCategoryForm] = useState<CategoryForm | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm | null>(null);
  const [confirmCategory, setConfirmCategory] = useState<VehicleSizeCategory | null>(null);
  const [confirmRule, setConfirmRule] = useState<VehicleModelSizeRule | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const categories = useQuery({ queryKey: ["vehicle-size-categories"], queryFn: getVehicleSizeCategories });
  const rules = useQuery({ queryKey: ["vehicle-model-size-rules"], queryFn: getVehicleModelSizeRules });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (!categoryForm) return null;
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        sortOrder: Number(categoryForm.sortOrder || 0),
        isActive: categoryForm.isActive,
      };
      return categoryForm.id
        ? updateVehicleSizeCategory(categoryForm.id, payload)
        : createVehicleSizeCategory(payload);
    },
    onSuccess: () => done("Categoria salva.", () => setCategoryForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const saveRule = useMutation({
    mutationFn: async () => {
      if (!ruleForm) return null;
      const payload = {
        brand: ruleForm.brand,
        model: ruleForm.model,
        sizeCategoryId: ruleForm.sizeCategoryId,
        isActive: ruleForm.isActive,
      };
      return ruleForm.id
        ? updateVehicleModelSizeRule(ruleForm.id, payload)
        : createVehicleModelSizeRule(payload);
    },
    onSuccess: () => done("Regra salva.", () => setRuleForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggleCategory = useMutation({
    mutationFn: () => {
      if (!confirmCategory) throw new Error("Categoria nao selecionada");
      return setVehicleSizeCategoryActive(confirmCategory.id, confirmCategory.isActive === false);
    },
    onSuccess: () => done("Categoria atualizada.", () => setConfirmCategory(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggleRule = useMutation({
    mutationFn: () => {
      if (!confirmRule) throw new Error("Regra nao selecionada");
      return setVehicleModelSizeRuleActive(confirmRule.id, confirmRule.isActive === false);
    },
    onSuccess: () => done("Regra atualizada.", () => setConfirmRule(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["vehicle-size-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["vehicle-model-size-rules"] });
  }

  const categoryOptions = (categories.data ?? []).map((category) => ({ label: category.name, value: category.id }));

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Portes de Veiculo">
        <div className="space-y-6">
          {(categories.isLoading || rules.isLoading) ? <LoadingState /> : null}
          {(categories.error || rules.error || error) ? <ErrorState message={error || "Nao foi possivel carregar portes."} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTab("categories")} variant={tab === "categories" ? "primary" : "ghost"}>Categorias</Button>
            <Button onClick={() => setTab("rules")} variant={tab === "rules" ? "primary" : "ghost"}>Regras por modelo</Button>
          </div>

          {tab === "categories" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setCategoryForm(emptyCategory)}>Nova categoria</Button></div>
              <DataTable
                rows={categories.data ?? []}
                columns={[
                  { header: "Nome", cell: (row) => row.name },
                  { header: "Descricao", cell: (row) => row.description ?? "-" },
                  { header: "Ordem", cell: (row) => row.sortOrder },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setCategoryForm({ id: row.id, name: row.name, description: row.description ?? "", sortOrder: String(row.sortOrder), isActive: row.isActive !== false })}
                onToggle={(row) => setConfirmCategory(row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setRuleForm(emptyRule)}>Nova regra</Button></div>
              <DataTable
                rows={rules.data ?? []}
                columns={[
                  { header: "Marca", cell: (row) => row.brand },
                  { header: "Modelo", cell: (row) => row.model },
                  { header: "Porte", cell: (row) => row.sizeCategory?.name ?? "-" },
                  { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
                ]}
                onEdit={(row) => setRuleForm({ id: row.id, brand: row.brand, model: row.model, sizeCategoryId: row.sizeCategoryId, isActive: row.isActive !== false })}
                onToggle={(row) => setConfirmRule(row)}
                toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
              />
            </div>
          )}

          {categoryForm ? (
            <FormModal title={categoryForm.id ? "Editar categoria" : "Nova categoria"} onClose={() => setCategoryForm(null)} onSubmit={() => saveCategory.mutate()} busy={saveCategory.isPending}>
              <FormField label="Nome" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
              <FormField label="Descricao" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
              <FormField label="Ordem" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })} />
            </FormModal>
          ) : null}

          {ruleForm ? (
            <FormModal title={ruleForm.id ? "Editar regra" : "Nova regra"} onClose={() => setRuleForm(null)} onSubmit={() => saveRule.mutate()} busy={saveRule.isPending}>
              <FormField label="Marca" value={ruleForm.brand} onChange={(event) => setRuleForm({ ...ruleForm, brand: event.target.value })} />
              <FormField label="Modelo" value={ruleForm.model} onChange={(event) => setRuleForm({ ...ruleForm, model: event.target.value })} />
              <SelectField label="Porte" options={categoryOptions} value={ruleForm.sizeCategoryId} onChange={(event) => setRuleForm({ ...ruleForm, sizeCategoryId: event.target.value })} />
            </FormModal>
          ) : null}

          {confirmCategory ? (
            <ConfirmDialog
              title={confirmCategory.isActive === false ? "Ativar categoria" : "Desativar categoria"}
              message={`Confirma ${confirmCategory.isActive === false ? "ativar" : "desativar"} ${confirmCategory.name}?`}
              confirmLabel={confirmCategory.isActive === false ? "Ativar" : "Desativar"}
              onCancel={() => setConfirmCategory(null)}
              onConfirm={() => toggleCategory.mutate()}
            />
          ) : null}

          {confirmRule ? (
            <ConfirmDialog
              title={confirmRule.isActive === false ? "Ativar regra" : "Desativar regra"}
              message={`Confirma ${confirmRule.isActive === false ? "ativar" : "desativar"} ${confirmRule.brand} ${confirmRule.model}?`}
              confirmLabel={confirmRule.isActive === false ? "Ativar" : "Desativar"}
              onCancel={() => setConfirmRule(null)}
              onConfirm={() => toggleRule.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
