"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { FormField, PercentInput } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { DataTable } from "@/features/crud/DataTable";
import { StatusBadge } from "@/features/crud/StatusBadge";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { errorMessage } from "@/features/crud/feedback";
import { getUnits } from "@/features/locations/locations.api";
import {
  FranchiseReport,
  FranchiseRule,
  closeFranchiseReport,
  createFranchiseRule,
  generateFranchiseReport,
  getFinancialFloat,
  getFinancialLedger,
  getFinancialOverview,
  getFranchiseReports,
  getFranchiseRules,
  updateFranchiseRule,
} from "@/features/financial/financial.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

type Tab = "overview" | "float" | "ledger" | "rules" | "reports";
type RuleForm = { id?: string; unitId: string; franchiseRevenuePercent: string; uauRoyaltyPercent: string; marketingFundPercent: string };
type ReportForm = { unitId: string; periodStart: string; periodEnd: string };

const emptyRule: RuleForm = { unitId: "", franchiseRevenuePercent: "", uauRoyaltyPercent: "", marketingFundPercent: "" };
const emptyReport: ReportForm = { unitId: "", periodStart: "", periodEnd: "" };

export default function AdminFinancialPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [ruleForm, setRuleForm] = useState<RuleForm | null>(null);
  const [reportForm, setReportForm] = useState<ReportForm | null>(null);
  const [closingReport, setClosingReport] = useState<FranchiseReport | null>(null);
  const [ledgerFilters, setLedgerFilters] = useState({ startDate: "", endDate: "", unitId: "", userId: "", partnerId: "", type: "", source: "", page: 1 });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const overview = useQuery({ queryKey: ["financial-overview"], queryFn: getFinancialOverview });
  const float = useQuery({ queryKey: ["financial-float"], queryFn: getFinancialFloat });
  const ledger = useQuery({ queryKey: ["financial-ledger", ledgerFilters], queryFn: () => getFinancialLedger(cleanParams({ ...ledgerFilters, limit: 20 })) });
  const rules = useQuery({ queryKey: ["financial-franchise-rules"], queryFn: getFranchiseRules });
  const reports = useQuery({ queryKey: ["financial-franchise-reports"], queryFn: getFranchiseReports });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });

  const ledgerRows = useMemo(() => {
    const data = ledger.data;
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? [];
  }, [ledger.data]);
  const ledgerTotal = Array.isArray(ledger.data) ? ledger.data.length : ledger.data?.total;

  const saveRule = useMutation({
    mutationFn: () => {
      if (!ruleForm) throw new Error("Regra incompleta");
      const payload = {
        unitId: ruleForm.unitId,
        franchiseRevenuePercent: Number(ruleForm.franchiseRevenuePercent),
        uauRoyaltyPercent: Number(ruleForm.uauRoyaltyPercent),
        marketingFundPercent: Number(ruleForm.marketingFundPercent),
      };
      return ruleForm.id ? updateFranchiseRule(ruleForm.id, payload) : createFranchiseRule(payload);
    },
    onSuccess: () => done("Regra financeira salva.", ["financial-franchise-rules"], () => setRuleForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const generateReport = useMutation({
    mutationFn: () => {
      if (!reportForm) throw new Error("Relatorio incompleto");
      return generateFranchiseReport(reportForm);
    },
    onSuccess: () => done("Relatorio gerado.", ["financial-franchise-reports"], () => setReportForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const closeReport = useMutation({
    mutationFn: () => {
      if (!closingReport) throw new Error("Relatorio nao selecionado");
      return closeFranchiseReport(closingReport.id);
    },
    onSuccess: () => done("Relatorio fechado.", ["financial-franchise-reports"], () => setClosingReport(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, queryKeys: string[], close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    queryKeys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey: [queryKey] }));
  }

  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Financial">
        <div className="space-y-6">
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"],
              ["float", "Float"],
              ["ledger", "Ledger"],
              ["rules", "Regras de Franquia"],
              ["reports", "Relatorios"],
            ].map(([value, label]) => (
              <Button key={value} type="button" variant={tab === value ? "primary" : "ghost"} onClick={() => setTab(value as Tab)}>
                {label}
              </Button>
            ))}
          </div>

          {tab === "overview" ? (
            overview.isLoading ? <LoadingState /> : overview.error ? <ErrorState /> : (
              <MetricGrid metrics={[
                ["Receita de assinaturas", overview.data?.subscriptionRevenue],
                ["Comissao de parceiros", overview.data?.partnerCommissionRevenue],
                ["Cashback emitido", overview.data?.totalCashbackIssued],
                ["Cashback usado", overview.data?.totalCashbackUsed],
                ["Cashback expirado", overview.data?.totalCashbackExpired],
                ["Float em circulacao", overview.data?.floatInCirculation],
                ["Repasse franquia estimado", overview.data?.estimatedFranchiseShare],
                ["Repasse UAU estimado", overview.data?.estimatedUauShare],
                ["Fundo de marketing", overview.data?.marketingFundAmount],
              ]} />
            )
          ) : null}

          {tab === "float" ? (
            float.isLoading ? <LoadingState /> : float.error ? <ErrorState /> : (
              <MetricGrid metrics={[
                ["Saldo disponivel", float.data?.totalAvailableBalance],
                ["Saldo promocional", float.data?.totalPromotionalBalance],
                ["Saldo bloqueado", float.data?.totalBlockedBalance],
                ["Cashback em circulacao", float.data?.totalCashbackInCirculation],
                ["Cashback emitido", float.data?.totalCashbackIssued],
                ["Cashback usado", float.data?.totalCashbackUsed],
                ["Cashback expirado", float.data?.totalCashbackExpired],
              ]} />
            )
          ) : null}

          {tab === "ledger" ? (
            <div className="space-y-4">
              <Card>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField label="Inicio" type="date" value={ledgerFilters.startDate} onChange={(event) => setLedgerFilters({ ...ledgerFilters, startDate: event.target.value, page: 1 })} />
                  <FormField label="Fim" type="date" value={ledgerFilters.endDate} onChange={(event) => setLedgerFilters({ ...ledgerFilters, endDate: event.target.value, page: 1 })} />
                  <SelectField label="Unidade" options={unitOptions} value={ledgerFilters.unitId} onChange={(event) => setLedgerFilters({ ...ledgerFilters, unitId: event.target.value, page: 1 })} />
                  <FormField label="Usuario ID" value={ledgerFilters.userId} onChange={(event) => setLedgerFilters({ ...ledgerFilters, userId: event.target.value, page: 1 })} />
                  <FormField label="Parceiro ID" value={ledgerFilters.partnerId} onChange={(event) => setLedgerFilters({ ...ledgerFilters, partnerId: event.target.value, page: 1 })} />
                  <FormField label="Tipo" value={ledgerFilters.type} onChange={(event) => setLedgerFilters({ ...ledgerFilters, type: event.target.value, page: 1 })} />
                  <FormField label="Origem" value={ledgerFilters.source} onChange={(event) => setLedgerFilters({ ...ledgerFilters, source: event.target.value, page: 1 })} />
                  <Button type="button" variant="ghost" onClick={() => setLedgerFilters({ startDate: "", endDate: "", unitId: "", userId: "", partnerId: "", type: "", source: "", page: 1 })}>Limpar filtros</Button>
                </div>
              </Card>
              {ledger.isLoading ? <LoadingState /> : ledger.error ? <ErrorState /> : (
                <>
                  <DataTable
                    rows={ledgerRows}
                    columns={[
                      { header: "Data", cell: (row) => formatDate(row.createdAt) },
                      { header: "Tipo", cell: (row) => row.type ?? "-" },
                      { header: "Origem", cell: (row) => row.source ?? "-" },
                      { header: "Valor", cell: (row) => money(row.amount) },
                      { header: "Saldo", cell: (row) => money(row.balanceAfter) },
                      { header: "Status", cell: (row) => row.status ?? "-" },
                      { header: "Descricao", cell: (row) => row.description ?? "-" },
                    ]}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-uau-gray">Total: {ledgerTotal ?? ledgerRows.length}</span>
                    <div className="flex gap-2">
                      <Button disabled={ledgerFilters.page <= 1} type="button" variant="ghost" onClick={() => setLedgerFilters({ ...ledgerFilters, page: ledgerFilters.page - 1 })}>Anterior</Button>
                      <Button type="button" variant="ghost" onClick={() => setLedgerFilters({ ...ledgerFilters, page: ledgerFilters.page + 1 })}>Proxima</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {tab === "rules" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setRuleForm(emptyRule)}>Nova regra</Button></div>
              {rules.isLoading ? <LoadingState /> : rules.error ? <ErrorState /> : (
                <DataTable
                  rows={rules.data ?? []}
                  columns={[
                    { header: "Unidade", cell: (row) => row.unit?.name ?? unitName(row.unitId, units.data) },
                    { header: "Franquia", cell: (row) => `${row.franchiseRevenuePercent}%` },
                    { header: "Royalty UAU", cell: (row) => `${row.uauRoyaltyPercent}%` },
                    { header: "Marketing", cell: (row) => `${row.marketingFundPercent}%` },
                  ]}
                  onEdit={(row) => setRuleForm(toRuleForm(row))}
                />
              )}
            </div>
          ) : null}

          {tab === "reports" ? (
            <div className="space-y-4">
              <div className="flex justify-end"><Button onClick={() => setReportForm(emptyReport)}>Gerar relatorio</Button></div>
              {reports.isLoading ? <LoadingState /> : reports.error ? <ErrorState /> : (
                <DataTable
                  rows={reports.data ?? []}
                  columns={[
                    { header: "Unidade", cell: (row) => row.unit?.name ?? unitName(row.unitId, units.data) },
                    { header: "Periodo", cell: (row) => `${formatDate(row.periodStart)} - ${formatDate(row.periodEnd)}` },
                    { header: "Assinaturas", cell: (row) => money(row.subscriptionGatewayAmount) },
                    { header: "Comissao parceiros", cell: (row) => money(row.partnerCommissionAmount) },
                    { header: "Franquia", cell: (row) => money(row.estimatedFranchiseShare) },
                    { header: "UAU", cell: (row) => money(row.estimatedUauShare) },
                    { header: "Marketing", cell: (row) => money(row.marketingFundAmount) },
                    { header: "Cashback usado", cell: (row) => money(row.cashbackUsedByCustomers) },
                    { header: "Cashback emitido", cell: (row) => money(row.cashbackIssued) },
                    { header: "Liquido", cell: (row) => money(row.netEstimatedAmount) },
                    { header: "Status", cell: (row) => <StatusBadge active={row.status !== "CLOSED"} label={row.status ?? "OPEN"} /> },
                  ]}
                  onToggle={(row) => setClosingReport(row)}
                  toggleLabel={() => "Fechar"}
                />
              )}
            </div>
          ) : null}

          {ruleForm ? (
            <FormModal title={ruleForm.id ? "Editar regra" : "Nova regra"} onClose={() => setRuleForm(null)} onSubmit={() => saveRule.mutate()} busy={saveRule.isPending}>
              <SelectField label="Unidade" options={unitOptions} value={ruleForm.unitId} onChange={(event) => setRuleForm({ ...ruleForm, unitId: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-3">
                <PercentInput label="Franquia (%)" value={ruleForm.franchiseRevenuePercent} onChange={(event) => setRuleForm({ ...ruleForm, franchiseRevenuePercent: event.target.value })} />
                <PercentInput label="Royalty UAU (%)" value={ruleForm.uauRoyaltyPercent} onChange={(event) => setRuleForm({ ...ruleForm, uauRoyaltyPercent: event.target.value })} />
                <PercentInput label="Marketing (%)" value={ruleForm.marketingFundPercent} onChange={(event) => setRuleForm({ ...ruleForm, marketingFundPercent: event.target.value })} />
              </div>
            </FormModal>
          ) : null}

          {reportForm ? (
            <FormModal title="Gerar relatorio" onClose={() => setReportForm(null)} onSubmit={() => generateReport.mutate()} busy={generateReport.isPending}>
              <SelectField label="Unidade" options={unitOptions} value={reportForm.unitId} onChange={(event) => setReportForm({ ...reportForm, unitId: event.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Inicio do periodo" type="date" value={reportForm.periodStart} onChange={(event) => setReportForm({ ...reportForm, periodStart: event.target.value })} />
                <FormField label="Fim do periodo" type="date" value={reportForm.periodEnd} onChange={(event) => setReportForm({ ...reportForm, periodEnd: event.target.value })} />
              </div>
            </FormModal>
          ) : null}

          {closingReport ? (
            <ConfirmDialog
              title="Fechar relatorio"
              message={`Confirma o fechamento do relatorio ${closingReport.id}?`}
              confirmLabel="Fechar"
              onCancel={() => setClosingReport(null)}
              onConfirm={() => closeReport.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function MetricGrid({ metrics }: { metrics: [string, number | undefined][] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <p className="text-sm font-semibold text-uau-gray">{label}</p>
          <p className="mt-2 text-2xl font-bold text-uau-black">{money(value)}</p>
        </Card>
      ))}
    </div>
  );
}

function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined)) as T;
}

function toRuleForm(rule: FranchiseRule): RuleForm {
  return {
    id: rule.id,
    unitId: rule.unitId,
    franchiseRevenuePercent: String(rule.franchiseRevenuePercent),
    uauRoyaltyPercent: String(rule.uauRoyaltyPercent),
    marketingFundPercent: String(rule.marketingFundPercent),
  };
}

function unitName(unitId?: string, units?: { id: string; name: string }[]) {
  return units?.find((unit) => unit.id === unitId)?.name ?? unitId ?? "-";
}

function money(value?: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "-";
}
