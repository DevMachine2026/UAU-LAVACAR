"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { getFranchiseAnpr, getFranchiseOperations } from "@/features/franchise-dashboard/franchise-dashboard.api";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { ClosureCard, OperationMetricCard, ShiftCard } from "@/features/operations/components";
import { getClosures, getShifts } from "@/features/operations/operations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { asArray, asRecord, getNumber } from "@/utils/data";

export default function FranchiseOperationsPage() {
  const operations = useQuery({ queryKey: ["franchise-operations-page"], queryFn: () => getFranchiseOperations() });
  const anpr = useQuery({ queryKey: ["franchise-anpr"], queryFn: () => getFranchiseAnpr() });
  const shifts = useQuery({ queryKey: ["franchise-operations-shifts"], queryFn: () => getShifts() });
  const closures = useQuery({ queryKey: ["franchise-operations-closures"], queryFn: () => getClosures() });
  const op = asRecord(operations.data);
  const anprData = asRecord(anpr.data);
  const openShifts = (shifts.data ?? []).filter((shift) => shift.status === "OPEN");
  const divergences = asArray(op.divergences ?? op.discrepancies);

  return (
    <ProtectedRoute roles={["FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Operacao da Franquia">
        <div className="space-y-6">
          {(operations.isLoading || anpr.isLoading || shifts.isLoading || closures.isLoading) ? <LoadingState /> : null}
          {(operations.error || anpr.error || shifts.error || closures.error) ? <ErrorState /> : null}

          <MetricGrid>
            <OperationMetricCard label="Shifts abertos" value={getNumber(op, ["openShifts"], openShifts.length)} />
            <OperationMetricCard label="Atendimentos hoje" value={getNumber(op, ["totalAttendancesToday", "attendancesToday"], 0)} />
            <OperationMetricCard label="Plano" value={getNumber(op, ["totalPlanAttendancesToday", "planAttendancesToday"], 0)} />
            <OperationMetricCard label="Avulso" value={getNumber(op, ["totalAvulsoAttendancesToday", "avulsoAttendancesToday"], 0)} />
            <OperationMetricCard label="Divergencias" value={getNumber(op, ["totalDivergences"], divergences.length)} />
            <OperationMetricCard label="ANPR eventos" value={getNumber(anprData, ["totalEvents"], 0)} />
          </MetricGrid>

          <Card>
            <div className="flex flex-wrap gap-2">
              <Link href="/operator/anpr"><Button type="button" variant="ghost">ANPR</Button></Link>
              <Link href="/operator/plate-check"><Button type="button" variant="ghost">Validar placa</Button></Link>
              <Link href="/operator/shifts"><Button type="button" variant="ghost">Expedientes</Button></Link>
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
