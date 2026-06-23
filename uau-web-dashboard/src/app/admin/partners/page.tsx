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
import { FormField, PercentInput } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { StatusBadge } from "@/features/crud/StatusBadge";
import { errorMessage } from "@/features/crud/feedback";
import { getCities, getStates, getUnits } from "@/features/locations/locations.api";
import { PartnerItem, createPartner, getPartners, setPartnerActive, updatePartner } from "@/features/partners/partners.api";
import { Toast } from "@/components/Toast";

type PartnerForm = {
  id?: string; name: string; document: string; email: string; phone: string; category: string; stateId: string; cityId: string; unitId: string;
  generatedCashbackPercent: string; customerCashbackPercent: string; uauCommissionPercent: string; acceptedCashbackLimitPercent: string;
};

const emptyPartner: PartnerForm = {
  name: "", document: "", email: "", phone: "", category: "", stateId: "", cityId: "", unitId: "",
  generatedCashbackPercent: "10", customerCashbackPercent: "5", uauCommissionPercent: "5", acceptedCashbackLimitPercent: "30",
};

export default function AdminPartnersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PartnerForm | null>(null);
  const [confirm, setConfirm] = useState<PartnerItem | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const partners = useQuery({ queryKey: ["partners"], queryFn: getPartners });
  const states = useQuery({ queryKey: ["states"], queryFn: getStates });
  const cities = useQuery({ queryKey: ["cities"], queryFn: getCities });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });

  const stateOptions = (states.data ?? []).map((state) => ({ label: state.name, value: state.id }));
  const cityOptions = (cities.data ?? []).filter((city) => !form?.stateId || city.stateId === form.stateId).map((city) => ({ label: city.name, value: city.id }));
  const unitOptions = (units.data ?? []).filter((unit) => !form?.cityId || unit.cityId === form.cityId).map((unit) => ({ label: unit.name, value: unit.id }));

  const save = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Parceiro incompleto");
      const payload = {
        name: form.name,
        document: form.document || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        category: form.category || undefined,
        stateId: form.stateId,
        cityId: form.cityId,
        unitId: form.unitId || undefined,
        generatedCashbackPercent: Number(form.generatedCashbackPercent || 0),
        customerCashbackPercent: Number(form.customerCashbackPercent || 0),
        uauCommissionPercent: Number(form.uauCommissionPercent || 0),
        acceptedCashbackLimitPercent: Number(form.acceptedCashbackLimitPercent || 0),
      };
      return form.id ? updatePartner(form.id, payload) : createPartner(payload);
    },
    onSuccess: () => done("Parceiro salvo.", () => setForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggle = useMutation({
    mutationFn: () => {
      if (!confirm) throw new Error("Parceiro nao selecionado");
      return setPartnerActive(confirm.id, confirm.isActive === false);
    },
    onSuccess: () => done("Status do parceiro atualizado.", () => setConfirm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["partners"] });
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Partners">
        <div className="space-y-6">
          {(partners.isLoading || states.isLoading || cities.isLoading || units.isLoading) ? <LoadingState /> : null}
          {(partners.error || error) ? <ErrorState message={error || "Nao foi possivel carregar parceiros."} /> : null}
          {notice ? <Toast message={notice} onDismiss={() => setNotice("")} /> : null}
          <div className="flex justify-end"><Button onClick={() => setForm(emptyPartner)}>Novo parceiro</Button></div>

          <DataTable
            rows={partners.data ?? []}
            columns={[
              { header: "Parceiro", cell: (row) => row.name },
              { header: "Categoria", cell: (row) => row.category ?? "-" },
              { header: "Cidade", cell: (row) => row.city?.name ?? cities.data?.find((city) => city.id === row.cityId)?.name ?? "-" },
              { header: "Cashback", cell: (row) => `${row.customerCashbackPercent ?? 0}% cliente / ${row.uauCommissionPercent ?? 0}% UAU` },
              { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
            ]}
            onEdit={(row) => setForm({
              id: row.id,
              name: row.name,
              document: row.document ?? "",
              email: row.email ?? "",
              phone: row.phone ?? "",
              category: row.category ?? "",
              stateId: row.stateId,
              cityId: row.cityId,
              unitId: row.unitId ?? "",
              generatedCashbackPercent: String(row.generatedCashbackPercent ?? 0),
              customerCashbackPercent: String(row.customerCashbackPercent ?? 0),
              uauCommissionPercent: String(row.uauCommissionPercent ?? 0),
              acceptedCashbackLimitPercent: String(row.acceptedCashbackLimitPercent ?? 0),
            })}
            onToggle={(row) => setConfirm(row)}
            toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
          />

          {form ? (
            <FormModal title={form.id ? "Editar parceiro" : "Novo parceiro"} onClose={() => setForm(null)} onSubmit={() => save.mutate()} busy={save.isPending}>
              <FormField label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <FormField label="Documento" value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <FormField label="Telefone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
              <FormField label="Categoria" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              <SelectField label="Estado" options={stateOptions} value={form.stateId} onChange={(event) => setForm({ ...form, stateId: event.target.value, cityId: "", unitId: "" })} />
              <SelectField label="Cidade" options={cityOptions} value={form.cityId} onChange={(event) => setForm({ ...form, cityId: event.target.value, unitId: "" })} />
              <SelectField label="Unidade" options={unitOptions} value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} placeholder="Opcional" />
              <div className="grid gap-4 md:grid-cols-2">
                <PercentInput label="Cashback gerado (%)" value={form.generatedCashbackPercent} onChange={(event) => setForm({ ...form, generatedCashbackPercent: event.target.value })} />
                <PercentInput label="Cashback cliente (%)" value={form.customerCashbackPercent} onChange={(event) => setForm({ ...form, customerCashbackPercent: event.target.value })} />
                <PercentInput label="Comissao UAU (%)" value={form.uauCommissionPercent} onChange={(event) => setForm({ ...form, uauCommissionPercent: event.target.value })} />
                <PercentInput label="Limite cashback aceito (%)" value={form.acceptedCashbackLimitPercent} onChange={(event) => setForm({ ...form, acceptedCashbackLimitPercent: event.target.value })} />
              </div>
            </FormModal>
          ) : null}

          {confirm ? (
            <ConfirmDialog
              title={confirm.isActive === false ? "Ativar parceiro" : "Desativar parceiro"}
              message={`Confirma ${confirm.isActive === false ? "ativar" : "desativar"} ${confirm.name}?`}
              confirmLabel={confirm.isActive === false ? "Ativar" : "Desativar"}
              onCancel={() => setConfirm(null)}
              onConfirm={() => toggle.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
