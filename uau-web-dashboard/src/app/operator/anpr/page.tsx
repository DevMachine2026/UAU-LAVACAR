"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { FormField } from "@/features/crud/FormField";
import { SelectField } from "@/features/crud/SelectField";
import { errorMessage } from "@/features/crud/feedback";
import { getAnprCameras, getAnprSummary, getLatestAnprEvents, simulateAnprEvent } from "@/features/anpr/anpr.api";
import { getUnits } from "@/features/locations/locations.api";
import { AnprEventCard, OperationMetricCard } from "@/features/operations/components";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export default function OperatorAnprPage() {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [plate, setPlate] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const cameras = useQuery({ queryKey: ["anpr-cameras"], queryFn: getAnprCameras });
  const summary = useQuery({ queryKey: ["anpr-summary", unitId], queryFn: () => getAnprSummary(unitId), enabled: Boolean(unitId), refetchInterval: 15000 });
  const events = useQuery({ queryKey: ["anpr-events", unitId], queryFn: () => getLatestAnprEvents(unitId), enabled: Boolean(unitId), refetchInterval: 15000 });

  const simulate = useMutation({
    mutationFn: () => {
      if (!cameraId) throw new Error("Informe o ID da camera cadastrada no ANPR.");
      return simulateAnprEvent({ unitId, cameraId, plate: normalizePlate(plate) });
    },
    onSuccess: () => {
      setNotice("Leitura simulada.");
      setError("");
      setPlate("");
      void queryClient.invalidateQueries({ queryKey: ["anpr-summary", unitId] });
      void queryClient.invalidateQueries({ queryKey: ["anpr-events", unitId] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));
  const byStatus = summary.data?.eventsByStatus ?? {};

  return (
    <ProtectedRoute roles={["OPERATOR", "FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="ANPR">
        <div className="space-y-6">
          {(units.isLoading || cameras.isLoading) ? <LoadingState /> : null}
          {(units.error || cameras.error || summary.error || events.error || error) ? <ErrorState message={error || "Nao foi possivel carregar ANPR."} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Unidade" options={unitOptions} value={unitId} onChange={(event) => setUnitId(event.target.value)} />
              <FormField
                label="ID da camera (cadastro ANPR)"
                value={cameraId}
                onChange={(event) => setCameraId(event.target.value)}
                placeholder="cuid da camera em anpr_cameras"
              />
            </div>
          </Card>

          {unitId ? (
            <>
              <MetricGrid>
                <OperationMetricCard label="Eventos" value={summary.data?.totalEvents ?? 0} />
                <OperationMetricCard label="Autorizados" value={summary.data?.authorized ?? byStatus.AUTHORIZED ?? 0} />
                <OperationMetricCard label="Bloqueados" value={summary.data?.blocked ?? byStatus.BLOCKED ?? 0} />
                <OperationMetricCard label="Avulso" value={summary.data?.avulso ?? byStatus.AVULSO ?? 0} />
                <OperationMetricCard label="Desconhecidos" value={summary.data?.unknown ?? byStatus.UNKNOWN ?? 0} />
                <OperationMetricCard label="Suspeitos" value={summary.data?.suspect ?? byStatus.SUSPECT ?? 0} />
              </MetricGrid>

              <Card>
                <p className="mb-4 text-lg font-bold text-uau-black">Simular leitura</p>
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <FormField label="Placa" value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} />
                  <Button
                    className="self-end"
                    disabled={!plate || !cameraId || simulate.isPending}
                    onClick={() => simulate.mutate()}
                  >
                    Simular
                  </Button>
                </div>
              </Card>

              <div>
                <p className="mb-3 text-lg font-bold text-uau-black">Ultimos eventos</p>
                {events.isLoading ? <LoadingState /> : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {(events.data ?? []).map((event) => <AnprEventCard event={event} key={event.id} />)}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
