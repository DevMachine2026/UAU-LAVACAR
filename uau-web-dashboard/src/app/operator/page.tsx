"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maskPlate } from "@/utils/masks";
import { Toast } from "@/components/Toast";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { FormField } from "@/features/crud/FormField";
import { SelectField } from "@/features/crud/SelectField";
import { errorMessage } from "@/features/crud/feedback";
import { getUnits } from "@/features/locations/locations.api";
import {
  Attendance,
  cancelAttendance,
  closeShift,
  completeAttendance,
  createManualAttendance,
  getLiveSummary,
  getReadingFields,
  getShifts,
  openShift,
} from "@/features/operations/operations.api";
import { LiveSummaryPanel, ReadingFieldsForm } from "@/features/operations/components";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export default function OperatorPage() {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [plate, setPlate] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [openingValues, setOpeningValues] = useState<Record<string, string>>({});
  const [closingValues, setClosingValues] = useState<Record<string, string>>({});
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<Attendance | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const readings = useQuery({ queryKey: ["reading-fields"], queryFn: getReadingFields });
  const shifts = useQuery({ queryKey: ["operator-shifts", unitId], queryFn: () => getShifts(unitId ? { unitId } : undefined) });

  const openShiftData = useMemo(
    () => (shifts.data ?? []).find((shift) => shift.status === "OPEN" && (!unitId || shift.unitId === unitId || shift.unit?.id === unitId)),
    [shifts.data, unitId],
  );
  const activeShiftId = openShiftData?.id ?? "";

  const summary = useQuery({
    queryKey: ["live-summary", activeShiftId],
    queryFn: () => getLiveSummary(activeShiftId),
    enabled: Boolean(activeShiftId),
    refetchInterval: 15000,
  });

  const open = useMutation({
    mutationFn: () => openShift({
      unitId,
      openingReadings: (readings.data ?? []).filter((field) => field.isActive !== false).map((field) => ({
        fieldId: field.id,
        openingValue: Number(openingValues[field.id] || 0),
      })),
      openingNotes: "Abertura via web dashboard",
    }),
    onSuccess: () => done("Expediente aberto."),
    onError: (err) => setError(errorMessage(err)),
  });

  const manual = useMutation({
    mutationFn: () => createManualAttendance({
      shiftId: activeShiftId,
      plate: normalizePlate(plate),
      type: "AVULSO",
      paymentMethod: "PIX",
      amountPaid: Number(amountPaid || 0),
      cashbackUsed: 0,
      status: "COMPLETED",
      notes: "Registro manual pelo painel operacional",
    }),
    onSuccess: () => {
      setPlate("");
      setAmountPaid("0");
      done("Atendimento registrado.");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const complete = useMutation({
    mutationFn: (attendance: Attendance) => completeAttendance(attendance.id),
    onSuccess: () => done("Atendimento concluido."),
    onError: (err) => setError(errorMessage(err)),
  });

  const cancel = useMutation({
    mutationFn: () => {
      if (!cancelConfirm) throw new Error("Atendimento nao selecionado");
      return cancelAttendance(cancelConfirm.id);
    },
    onSuccess: () => {
      setCancelConfirm(null);
      done("Atendimento cancelado.");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const close = useMutation({
    mutationFn: () => closeShift(activeShiftId, {
      closingReadings: (readings.data ?? []).filter((field) => field.isActive !== false).map((field) => ({
        fieldId: field.id,
        closingValue: Number(closingValues[field.id] || 0),
      })),
      closingNotes: "Fechamento via web dashboard",
    }),
    onSuccess: () => {
      setCloseConfirm(false);
      setClosingValues({});
      done("Expediente fechado.");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string) {
    setNotice(message);
    setError("");
    void queryClient.invalidateQueries({ queryKey: ["operator-shifts"] });
    void queryClient.invalidateQueries({ queryKey: ["live-summary"] });
  }

  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["OPERATOR", "FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Operacao">
        <div className="space-y-6">
          {(units.isLoading || readings.isLoading || shifts.isLoading) ? <LoadingState /> : null}
          {(units.error || readings.error || shifts.error || summary.error || error) ? <ErrorState message={error || "Nao foi possivel carregar a operacao."} /> : null}
          {notice ? <Toast message={notice} onDismiss={() => setNotice("")} /> : null}

          <Card>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
              <SelectField label="Unidade" options={unitOptions} value={unitId} onChange={(event) => setUnitId(event.target.value)} />
              <Link href="/operator/plate-check" className="self-end"><Button type="button" className="w-full">Baixa por placa</Button></Link>
              <Link href="/operator/anpr" className="self-end"><Button type="button" variant="ghost" className="w-full">ANPR</Button></Link>
              <Link href="/operator/shifts" className="self-end"><Button type="button" variant="ghost" className="w-full">Expedientes</Button></Link>
            </div>
          </Card>

          {!activeShiftId ? (
            <Card>
              <p className="mb-4 text-lg font-bold text-uau-black">Abrir expediente</p>
              <ReadingFieldsForm fields={readings.data ?? []} values={openingValues} onChange={setOpeningValues} />
              <div className="mt-5">
                <Button disabled={!unitId || open.isPending} onClick={() => open.mutate()}>Abrir expediente</Button>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <p className="text-sm font-semibold text-uau-gray">Expediente aberto</p>
                <p className="mt-1 text-xl font-bold text-uau-black">{openShiftData?.unit?.name ?? unitId}</p>
                <p className="text-sm text-uau-gray">{openShiftData?.openedAt ? formatDate(openShiftData.openedAt) : activeShiftId}</p>
              </Card>

              {summary.isLoading ? <LoadingState /> : <LiveSummaryPanel summary={summary.data} onComplete={(attendance) => complete.mutate(attendance)} onCancel={setCancelConfirm} />}

              <Card>
                <p className="mb-4 text-lg font-bold text-uau-black">Registrar carro manualmente</p>
                <div className="grid gap-4 md:grid-cols-[1fr_160px_auto]">
                  <FormField
                    label="Placa *"
                    placeholder="Ex: ABC-1234"
                    value={plate}
                    onChange={(event) => setPlate(maskPlate(event.target.value))}
                  />
                  <FormField
                    label="Valor R$ *"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                  />
                  <Button className="self-end" disabled={!plate || manual.isPending} onClick={() => manual.mutate()}>Registrar</Button>
                </div>
              </Card>

              <Card>
                <p className="mb-4 text-lg font-bold text-uau-black">Fechar expediente</p>
                <ReadingFieldsForm fields={readings.data ?? []} values={closingValues} onChange={setClosingValues} />
                <div className="mt-5">
                  <Button disabled={close.isPending} onClick={() => setCloseConfirm(true)}>Fechar expediente</Button>
                </div>
              </Card>
            </>
          )}

          {closeConfirm ? (
            <ConfirmDialog
              title="Fechar expediente"
              message="Confirma o fechamento do expediente atual?"
              confirmLabel="Fechar"
              onCancel={() => setCloseConfirm(false)}
              onConfirm={() => close.mutate()}
            />
          ) : null}

          {cancelConfirm ? (
            <ConfirmDialog
              title="Cancelar atendimento"
              message={`Confirma cancelar o atendimento da placa ${cancelConfirm.plate ?? ""}?`}
              confirmLabel="Cancelar"
              onCancel={() => setCancelConfirm(null)}
              onConfirm={() => cancel.mutate()}
            />
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
