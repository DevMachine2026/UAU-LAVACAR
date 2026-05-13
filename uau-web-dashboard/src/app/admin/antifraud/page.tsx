"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { DataTable } from "@/features/crud/DataTable";
import { FormField } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { StatusBadge } from "@/features/crud/StatusBadge";
import { errorMessage } from "@/features/crud/feedback";
import {
  FraudFlag,
  ReviewFraudFlagPayload,
  blockUser,
  getFraudFlag,
  getFraudFlags,
  getSecurityLogs,
  markUserSuspect,
  reviewFraudFlag,
  unblockUser,
} from "@/features/antifraud/antifraud.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

type Tab = "flags" | "logs" | "actions";
type ReviewForm = { flag: FraudFlag; status: ReviewFraudFlagPayload["status"]; reason: string };
type UserAction = "suspect" | "block" | "unblock";

export default function AdminAntifraudPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("flags");
  const [flagFilters, setFlagFilters] = useState({ status: "", severity: "", type: "" });
  const [logFilters, setLogFilters] = useState({ eventType: "", userId: "", startDate: "", endDate: "" });
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [reviewForm, setReviewForm] = useState<ReviewForm | null>(null);
  const [actionForm, setActionForm] = useState({ userId: "", reason: "" });
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const flags = useQuery({ queryKey: ["antifraud-flags", flagFilters], queryFn: () => getFraudFlags(cleanParams(flagFilters)) });
  const flagDetail = useQuery({ queryKey: ["antifraud-flag", selectedFlagId], queryFn: () => getFraudFlag(selectedFlagId), enabled: Boolean(selectedFlagId) });
  const logs = useQuery({ queryKey: ["security-logs", logFilters], queryFn: () => getSecurityLogs(cleanParams(logFilters)) });

  const review = useMutation({
    mutationFn: () => {
      if (!reviewForm) throw new Error("Revisao incompleta");
      return reviewFraudFlag(reviewForm.flag.id, { status: reviewForm.status, reason: reviewForm.reason || undefined });
    },
    onSuccess: () => done("Flag revisada.", () => setReviewForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const userAction = useMutation({
    mutationFn: (action: UserAction) => {
      if (!actionForm.userId || !actionForm.reason) throw new Error("Informe usuario e motivo.");
      const payload = { reason: actionForm.reason };
      if (action === "suspect") return markUserSuspect(actionForm.userId, payload);
      if (action === "block") return blockUser(actionForm.userId, payload);
      return unblockUser(actionForm.userId, payload);
    },
    onSuccess: () => {
      setConfirmBlock(false);
      setNotice("Acao aplicada ao usuario.");
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["antifraud-flags"] });
      void queryClient.invalidateQueries({ queryKey: ["security-logs"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["antifraud-flags"] });
    if (selectedFlagId) void queryClient.invalidateQueries({ queryKey: ["antifraud-flag", selectedFlagId] });
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Antifraud">
        <div className="space-y-6">
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}
          <div className="flex flex-wrap gap-2">
            {[
              ["flags", "Flags"],
              ["logs", "Security Logs"],
              ["actions", "Acoes"],
            ].map(([value, label]) => (
              <Button key={value} type="button" variant={tab === value ? "primary" : "ghost"} onClick={() => setTab(value as Tab)}>
                {label}
              </Button>
            ))}
          </div>

          {tab === "flags" ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <Card>
                  <div className="grid gap-4 md:grid-cols-4">
                    <SelectField label="Status" options={["OPEN", "REVIEWED", "DISMISSED", "BLOCKED"].map(option)} value={flagFilters.status} onChange={(event) => setFlagFilters({ ...flagFilters, status: event.target.value })} />
                    <SelectField label="Severidade" options={["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(option)} value={flagFilters.severity} onChange={(event) => setFlagFilters({ ...flagFilters, severity: event.target.value })} />
                    <FormField label="Tipo" value={flagFilters.type} onChange={(event) => setFlagFilters({ ...flagFilters, type: event.target.value })} />
                    <Button type="button" variant="ghost" onClick={() => setFlagFilters({ status: "", severity: "", type: "" })}>Limpar filtros</Button>
                  </div>
                </Card>
                {flags.isLoading ? <LoadingState /> : flags.error ? <ErrorState /> : (
                  <DataTable
                    rows={flags.data ?? []}
                    columns={[
                      { header: "Tipo", cell: (row) => row.type ?? "-" },
                      { header: "Severidade", cell: (row) => row.severity ?? "-" },
                      { header: "Usuario", cell: (row) => row.userId ?? "-" },
                      { header: "Status", cell: (row) => <StatusBadge active={row.status === "OPEN"} label={row.status ?? "OPEN"} /> },
                      { header: "Criada em", cell: (row) => formatDate(row.createdAt) },
                    ]}
                    onEdit={(row) => setSelectedFlagId(row.id)}
                    onToggle={(row) => setReviewForm({ flag: row, status: "REVIEWED", reason: "" })}
                    toggleLabel={() => "Revisar"}
                  />
                )}
              </div>
              <Card>
                <p className="font-bold text-uau-black">Detalhe da flag</p>
                {!selectedFlagId ? <p className="mt-2 text-sm text-uau-gray">Selecione uma flag para ver o detalhe.</p> : null}
                {flagDetail.isLoading ? <div className="mt-4"><LoadingState /></div> : null}
                {flagDetail.data ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <Info label="ID" value={flagDetail.data.id} />
                    <Info label="Usuario" value={flagDetail.data.userId} />
                    <Info label="Tipo" value={flagDetail.data.type} />
                    <Info label="Severidade" value={flagDetail.data.severity} />
                    <Info label="Status" value={flagDetail.data.status} />
                    <Info label="Motivo" value={flagDetail.data.reason ?? flagDetail.data.description} />
                    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-white">
                      {JSON.stringify(flagDetail.data.metadata ?? {}, null, 2)}
                    </pre>
                    <Button type="button" onClick={() => setReviewForm({ flag: flagDetail.data, status: "REVIEWED", reason: "" })}>Revisar flag</Button>
                  </div>
                ) : null}
              </Card>
            </div>
          ) : null}

          {tab === "logs" ? (
            <div className="space-y-4">
              <Card>
                <div className="grid gap-4 md:grid-cols-5">
                  <FormField label="Evento" value={logFilters.eventType} onChange={(event) => setLogFilters({ ...logFilters, eventType: event.target.value })} />
                  <FormField label="Usuario ID" value={logFilters.userId} onChange={(event) => setLogFilters({ ...logFilters, userId: event.target.value })} />
                  <FormField label="Inicio" type="date" value={logFilters.startDate} onChange={(event) => setLogFilters({ ...logFilters, startDate: event.target.value })} />
                  <FormField label="Fim" type="date" value={logFilters.endDate} onChange={(event) => setLogFilters({ ...logFilters, endDate: event.target.value })} />
                  <Button type="button" variant="ghost" onClick={() => setLogFilters({ eventType: "", userId: "", startDate: "", endDate: "" })}>Limpar filtros</Button>
                </div>
              </Card>
              {logs.isLoading ? <LoadingState /> : logs.error ? <ErrorState /> : (
                <DataTable
                  rows={logs.data ?? []}
                  columns={[
                    { header: "Data", cell: (row) => formatDate(row.createdAt) },
                    { header: "Evento", cell: (row) => row.eventType ?? "-" },
                    { header: "Usuario", cell: (row) => row.userId ?? "-" },
                    { header: "IP", cell: (row) => row.ipAddress ?? "-" },
                    { header: "User agent", cell: (row) => <span className="line-clamp-2">{row.userAgent ?? "-"}</span> },
                    { header: "Metadata", cell: (row) => <code className="text-xs">{shortJson(row.metadata)}</code> },
                  ]}
                />
              )}
            </div>
          ) : null}

          {tab === "actions" ? (
            <Card>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Usuario ID" value={actionForm.userId} onChange={(event) => setActionForm({ ...actionForm, userId: event.target.value })} />
                <FormField label="Motivo" value={actionForm.reason} onChange={(event) => setActionForm({ ...actionForm, reason: event.target.value })} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" variant="ghost" disabled={userAction.isPending} onClick={() => userAction.mutate("suspect")}>Marcar suspeito</Button>
                <Button type="button" disabled={userAction.isPending} onClick={() => setConfirmBlock(true)}>Bloquear usuario</Button>
                <Button type="button" variant="ghost" disabled={userAction.isPending} onClick={() => userAction.mutate("unblock")}>Desbloquear usuario</Button>
              </div>
            </Card>
          ) : null}

          {reviewForm ? (
            <FormModal title="Revisar flag" onClose={() => setReviewForm(null)} onSubmit={() => review.mutate()} busy={review.isPending}>
              <SelectField label="Resultado" options={["REVIEWED", "DISMISSED", "BLOCKED"].map(option)} value={reviewForm.status} onChange={(event) => setReviewForm({ ...reviewForm, status: event.target.value as ReviewFraudFlagPayload["status"] })} />
              <FormField label="Motivo" value={reviewForm.reason} onChange={(event) => setReviewForm({ ...reviewForm, reason: event.target.value })} />
            </FormModal>
          ) : null}

          {confirmBlock ? (
            <ConfirmDialog
              title="Bloquear usuario"
              message={`Confirma o bloqueio do usuario ${actionForm.userId || "selecionado"}?`}
              confirmLabel="Bloquear"
              onCancel={() => setConfirmBlock(false)}
              onConfirm={() => userAction.mutate("block")}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-uau-gray">{label}</p>
      <p className="break-words text-uau-black">{value || "-"}</p>
    </div>
  );
}

function option(value: string) {
  return { label: value, value };
}

function cleanParams<T extends Record<string, string>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "")) as T;
}

function shortJson(value?: Record<string, unknown> | null) {
  if (!value) return "-";
  const text = JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
