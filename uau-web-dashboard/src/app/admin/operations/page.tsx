"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { getAdminAnpr, getAdminOperations } from "@/features/admin-dashboard/admin-dashboard.api";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { ClosureCard, OperationMetricCard, ShiftCard } from "@/features/operations/components";
import { getClosures, getShifts } from "@/features/operations/operations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { asArray, asRecord, getNumber } from "@/utils/data";

export default function AdminOperationsPage() {
  const operations = useQuery({ queryKey: ["admin-operations"], queryFn: getAdminOperations });
  const anpr = useQuery({ queryKey: ["admin-anpr"], queryFn: getAdminAnpr });
  const shifts = useQuery({ queryKey: ["admin-operations-shifts"], queryFn: () => getShifts() });
  const closures = useQuery({ queryKey: ["admin-operations-closures"], queryFn: () => getClosures() });
  const op = asRecord(operations.data);
  const anprData = asRecord(anpr.data);
  const openShifts = (shifts.data ?? []).filter((shift) => shift.status === "OPEN");
  const divergences = asArray(op.divergences ?? op.discrepancies);

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Operacoes">
        <div className="space-y-6">
          {(operations.isLoading || anpr.isLoading || shifts.isLoading || closures.isLoading) ? <LoadingState /> : null}
          {(operations.error || anpr.error || shifts.error || closures.error) ? <ErrorState /> : null}

          <MetricGrid>
            <OperationMetricCard label="Shifts abertos" value={getNumber(op, ["openShifts"], openShifts.length)} />
            <OperationMetricCard label="Atendimentos hoje" value={getNumber(op, ["totalAttendancesToday", "attendancesToday"], 0)} />
            <OperationMetricCard label="Divergencias" value={getNumber(op, ["divergences", "totalDivergences"], divergences.length)} />
            <OperationMetricCard label="Unidades abertas" value={getNumber(op, ["openUnits", "unitsWithOpenOperation"], openShifts.length)} />
            <OperationMetricCard label="ANPR eventos" value={getNumber(anprData, ["totalEvents"], 0)} />
            <OperationMetricCard label="ANPR suspeitos" value={getNumber(anprData, ["suspect", "suspectEvents"], 0)} />
          </MetricGrid>

          <Card>
            <div className="flex flex-wrap gap-2">
              <Link href="/operator/anpr"><Button type="button" variant="ghost">Abrir ANPR</Button></Link>
              <Link href="/operator/plate-check"><Button type="button" variant="ghost">Validar placa</Button></Link>
              <Link href="/operator/shifts"><Button type="button" variant="ghost">Ver expedientes</Button></Link>
            </div>
          </Card>

          <div>
            <p className="mb-3 text-lg font-bold text-uau-black">Shifts abertos</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {openShifts.map((shift) => <ShiftCard shift={shift} key={shift.id} />)}
            </div>
          </div>

          <div>
            <p className="mb-3 text-lg font-bold text-uau-black">Fechamentos recentes</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(closures.data ?? []).slice(0, 6).map((closure) => <ClosureCard closure={closure} key={closure.id} />)}
            </div>
          </div>

          {divergences.length ? (
            <Card>
              <p className="mb-3 text-lg font-bold text-uau-black">Divergencias</p>
              <pre className="overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-white">{JSON.stringify(divergences, null, 2)}</pre>
            </Card>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
