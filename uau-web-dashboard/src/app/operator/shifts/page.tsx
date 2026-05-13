"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { FormField } from "@/features/crud/FormField";
import { SelectField } from "@/features/crud/SelectField";
import { DataTable } from "@/features/crud/DataTable";
import { getUnits } from "@/features/locations/locations.api";
import { ClosureCard, LiveSummaryPanel } from "@/features/operations/components";
import { Shift, getClosures, getLiveSummary, getShift, getShifts } from "@/features/operations/operations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export default function OperatorShiftsPage() {
  const [filters, setFilters] = useState({ unitId: "", status: "", date: "" });
  const [selected, setSelected] = useState<Shift | null>(null);
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const shifts = useQuery({ queryKey: ["operator-shifts-list", filters], queryFn: () => getShifts(cleanParams(filters)) });
  const shiftDetail = useQuery({ queryKey: ["operator-shift-detail", selected?.id], queryFn: () => getShift(selected?.id ?? ""), enabled: Boolean(selected?.id) });
  const summary = useQuery({ queryKey: ["operator-shift-summary", selected?.id], queryFn: () => getLiveSummary(selected?.id ?? ""), enabled: Boolean(selected?.id) });
  const closures = useQuery({ queryKey: ["operator-closures", filters], queryFn: () => getClosures(cleanParams({ unitId: filters.unitId, date: filters.date })) });
  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["OPERATOR", "FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Expedientes">
        <div className="space-y-6">
          {(units.isLoading || shifts.isLoading) ? <LoadingState /> : null}
          {(units.error || shifts.error || closures.error) ? <ErrorState /> : null}
          <Card>
            <div className="grid gap-4 md:grid-cols-4">
              <SelectField label="Unidade" options={unitOptions} value={filters.unitId} onChange={(event) => setFilters({ ...filters, unitId: event.target.value })} />
              <SelectField label="Status" options={["OPEN", "CLOSED", "CANCELED"].map(option)} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} />
              <FormField label="Data" type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
              <button className="self-end rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold" onClick={() => setFilters({ unitId: "", status: "", date: "" })}>Limpar</button>
            </div>
          </Card>

          <DataTable
            rows={shifts.data ?? []}
            columns={[
              { header: "Unidade", cell: (row) => row.unit?.name ?? row.unitId ?? "-" },
              { header: "Status", cell: (row) => row.status ?? "-" },
              { header: "Abertura", cell: (row) => formatDate(row.openedAt) },
              { header: "Fechamento", cell: (row) => formatDate(row.closedAt ?? undefined) },
              { header: "Operador", cell: (row) => row.operatorUserId ?? "-" },
            ]}
            onEdit={(row) => setSelected(row)}
          />

          {selected ? (
            <Card>
              <p className="text-lg font-bold text-uau-black">Detalhe do expediente</p>
              <p className="mt-1 text-sm text-uau-gray">{shiftDetail.data?.id ?? selected.id}</p>
              {summary.isLoading ? <div className="mt-4"><LoadingState /></div> : <div className="mt-4"><LiveSummaryPanel summary={summary.data} /></div>}
            </Card>
          ) : null}

          <div>
            <p className="mb-3 text-lg font-bold text-uau-black">Fechamentos</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(closures.data ?? []).map((closure) => <ClosureCard closure={closure} key={closure.id} />)}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function option(value: string) {
  return { label: value, value };
}

function cleanParams<T extends Record<string, string>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "")) as T;
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
