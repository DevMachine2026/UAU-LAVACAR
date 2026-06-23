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
  CampaignItem,
  CampaignMetrics,
  CampaignPayload,
  createCampaign,
  getCampaignMetrics,
  getCampaigns,
  setCampaignActive,
  updateCampaign,
} from "@/features/campaigns/campaigns.api";
import { Toast } from "@/components/Toast";

type CampaignForm = {
  id?: string; title: string; subtitle: string; body: string; imageUrl: string; ctaLabel: string; ctaUrl: string;
  type: CampaignPayload["type"]; priority: CampaignPayload["priority"]; targetAudience: CampaignPayload["targetAudience"];
  startsAt: string; endsAt: string; displayFrequency: CampaignPayload["displayFrequency"]; isActive?: boolean;
};

const emptyCampaign: CampaignForm = {
  title: "", subtitle: "", body: "", imageUrl: "", ctaLabel: "", ctaUrl: "",
  type: "BANNER", priority: "MEDIUM", targetAudience: "ALL", startsAt: toLocalInput(new Date()), endsAt: "", displayFrequency: "DAILY",
};

export default function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CampaignForm | null>(null);
  const [confirm, setConfirm] = useState<CampaignItem | null>(null);
  const [metrics, setMetrics] = useState<{ campaign: CampaignItem; data: CampaignMetrics } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: getCampaigns });

  const save = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Campanha incompleta");
      const payload: CampaignPayload = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        body: form.body || undefined,
        imageUrl: form.imageUrl || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaUrl: form.ctaUrl || undefined,
        type: form.type,
        priority: form.priority,
        targetAudience: form.targetAudience,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        displayFrequency: form.displayFrequency,
      };
      return form.id ? updateCampaign(form.id, payload) : createCampaign(payload);
    },
    onSuccess: () => done("Campanha salva.", () => setForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const toggle = useMutation({
    mutationFn: () => {
      if (!confirm) throw new Error("Campanha nao selecionada");
      return setCampaignActive(confirm.id, confirm.isActive === false);
    },
    onSuccess: () => done("Status da campanha atualizado.", () => setConfirm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const loadMetrics = useMutation({
    mutationFn: (campaign: CampaignItem) => getCampaignMetrics(campaign.id).then((data) => ({ campaign, data })),
    onSuccess: (data) => {
      setMetrics(data);
      setError("");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Campaigns">
        <div className="space-y-6">
          {campaigns.isLoading ? <LoadingState /> : null}
          {(campaigns.error || error) ? <ErrorState message={error || "Nao foi possivel carregar campanhas."} /> : null}
          {notice ? <Toast message={notice} onDismiss={() => setNotice("")} /> : null}
          <div className="flex justify-end"><Button onClick={() => setForm(emptyCampaign)}>Nova campanha</Button></div>
          <DataTable
            rows={campaigns.data ?? []}
            columns={[
              { header: "Campanha", cell: (row) => row.title },
              { header: "Tipo", cell: (row) => row.type },
              { header: "Prioridade", cell: (row) => row.priority },
              { header: "Publico", cell: (row) => row.targetAudience },
              { header: "Inicio", cell: (row) => formatDate(row.startsAt) },
              { header: "Status", cell: (row) => <StatusBadge active={row.isActive} /> },
            ]}
            onEdit={(row) => setForm(toCampaignForm(row))}
            onToggle={(row) => setConfirm(row)}
            toggleLabel={(row) => row.isActive === false ? "Ativar" : "Desativar"}
          />
          <Card>
            <p className="mb-3 font-bold text-uau-black">Metricas</p>
            <div className="flex flex-wrap gap-2">
              {(campaigns.data ?? []).map((campaign) => (
                <Button key={campaign.id} onClick={() => loadMetrics.mutate(campaign)} type="button" variant="ghost">
                  {campaign.title}
                </Button>
              ))}
            </div>
            {metrics ? (
              <pre className="mt-4 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-white">
                {JSON.stringify(metrics.data, null, 2)}
              </pre>
            ) : null}
          </Card>

          {form ? (
            <FormModal title={form.id ? "Editar campanha" : "Nova campanha"} onClose={() => setForm(null)} onSubmit={() => save.mutate()} busy={save.isPending}>
              <FormField label="Titulo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <FormField label="Subtitulo" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
              <FormField label="Texto" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
              <FormField label="Imagem URL" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="CTA label" value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
                <FormField label="CTA URL" value={form.ctaUrl} onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField label="Tipo" options={["POPUP", "BANNER", "CARD", "PUSH"].map(option)} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CampaignForm["type"] })} />
                <SelectField label="Prioridade" options={["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(option)} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as CampaignForm["priority"] })} />
              </div>
              <SelectField label="Publico" options={["ALL", "CUSTOMERS", "NON_SUBSCRIBERS", "ACTIVE_SUBSCRIBERS", "OVERDUE_USERS", "FRANCHISE_OWNERS", "PARTNERS"].map(option)} value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value as CampaignForm["targetAudience"] })} />
              <SelectField label="Frequencia" options={["ONCE", "EVERY_OPEN", "DAILY", "UNTIL_CLICK"].map(option)} value={form.displayFrequency} onChange={(event) => setForm({ ...form, displayFrequency: event.target.value as CampaignForm["displayFrequency"] })} />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Inicio" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
                <FormField label="Fim" type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
              </div>
            </FormModal>
          ) : null}

          {confirm ? (
            <ConfirmDialog
              title={confirm.isActive === false ? "Ativar campanha" : "Desativar campanha"}
              message={`Confirma ${confirm.isActive === false ? "ativar" : "desativar"} ${confirm.title}?`}
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

function option(value: string) {
  return { label: value, value };
}

function toCampaignForm(campaign: CampaignItem): CampaignForm {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle ?? "",
    body: campaign.body ?? "",
    imageUrl: campaign.imageUrl ?? "",
    ctaLabel: campaign.ctaLabel ?? "",
    ctaUrl: campaign.ctaUrl ?? "",
    type: campaign.type,
    priority: campaign.priority,
    targetAudience: campaign.targetAudience,
    startsAt: toLocalInput(campaign.startsAt),
    endsAt: campaign.endsAt ? toLocalInput(campaign.endsAt) : "",
    displayFrequency: campaign.displayFrequency,
    isActive: campaign.isActive,
  };
}

function toLocalInput(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
