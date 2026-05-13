"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/State";
import { FormField } from "@/features/crud/FormField";
import { SelectField } from "@/features/crud/SelectField";
import { errorMessage } from "@/features/crud/feedback";
import { getUnits } from "@/features/locations/locations.api";
import { PlateCheckResult } from "@/features/operations/components";
import { PlateCheck, checkPlate, confirmPlateWash } from "@/features/operations/operations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export default function PlateCheckPage() {
  const queryClient = useQueryClient();
  const [plate, setPlate] = useState("");
  const [unitId, setUnitId] = useState("");
  const [result, setResult] = useState<PlateCheck | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });

  const check = useMutation({
    mutationFn: () => checkPlate(normalizePlate(plate), unitId),
    onSuccess: (data) => {
      setResult(data);
      setNotice("");
      setError("");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const confirm = useMutation({
    mutationFn: () => confirmPlateWash(normalizePlate(plate), { unitId }),
    onSuccess: () => {
      setNotice("Baixa registrada com sucesso.");
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["live-summary"] });
      check.mutate();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["OPERATOR", "FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Validacao de Placa">
        <div className="space-y-6">
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          <Card>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <FormField label="Placa" className="uppercase" value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} />
              <SelectField label="Unidade" options={unitOptions} value={unitId} onChange={(event) => setUnitId(event.target.value)} />
              <Button className="self-end" disabled={!plate || !unitId || check.isPending} onClick={() => check.mutate()}>
                Consultar
              </Button>
            </div>
          </Card>

          {check.isPending ? <Card>Consultando placa...</Card> : null}
          {result ? <PlateCheckResult result={result} busy={confirm.isPending} onConfirm={() => confirm.mutate()} /> : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
