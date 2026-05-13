import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";
import { AttendanceForm } from "@/features/operator/AttendanceForm";
import { CloseShiftForm } from "@/features/operator/CloseShiftForm";
import { LiveSummaryCard } from "@/features/operator/LiveSummaryCard";
import { OperatorShiftCard } from "@/features/operator/OperatorShiftCard";
import { ReadingFieldsForm } from "@/features/operator/ReadingFieldsForm";
import {
  CloseShiftPayload,
  ManualAttendancePayload,
  OperationalShift,
  ReadingField,
  VehicleAttendance
} from "@/features/operator/operator.api";
import {
  useCancelAttendance,
  useCloseShift,
  useCompleteAttendance,
  useLiveSummary,
  useManualAttendance,
  useOpenShift,
  useOperationalShift,
  useOperationalShifts,
  useReadingFields
} from "@/features/operator/operator.hooks";
import { asArray, asRecord, getNumber, getString } from "@/utils/data";

const ALLOWED_ROLES = ["OPERATOR", "FRANCHISE_OWNER", "SUPER_ADMIN"];

export default function OperatorScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [unitId, setUnitId] = useState(user?.defaultUnitId ?? "");
  const [openingNotes, setOpeningNotes] = useState("");
  const [openingValues, setOpeningValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readingFieldsQuery = useReadingFields();
  const shiftsQuery = useOperationalShifts();
  const openShiftMutation = useOpenShift();
  const manualAttendanceMutation = useManualAttendance();
  const completeMutation = useCompleteAttendance();
  const cancelMutation = useCancelAttendance();
  const closeShiftMutation = useCloseShift();

  const shifts = asArray<OperationalShift>(shiftsQuery.data);
  const currentShift = useMemo(() => shifts.find((shift) => asRecord(shift).status === "OPEN"), [shifts]);
  const shiftDetailQuery = useOperationalShift(currentShift?.id);
  const liveSummaryQuery = useLiveSummary(currentShift?.id);
  const readingFields = asArray<ReadingField>(readingFieldsQuery.data).filter((field) => asRecord(field).isActive !== false);
  const shiftDetail = shiftDetailQuery.data ?? currentShift;
  const attendances = asArray<VehicleAttendance>(asRecord(shiftDetail).attendances).slice(0, 8);
  const closure = closeShiftMutation.data;
  const allowed = user?.role ? ALLOWED_ROLES.includes(user.role) : false;

  async function refreshOperational() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["operator", "shifts"] }),
      queryClient.invalidateQueries({ queryKey: ["operator", "live-summary"] })
    ]);
  }

  async function openShift() {
    setError(null);
    if (!unitId.trim()) {
      setError("Informe a unidade para abrir o expediente.");
      return;
    }

    const openingReadings = readingFields.map((field) => ({
      fieldId: field.id,
      openingValue: Number((openingValues[field.id] ?? "").replace(",", "."))
    }));

    if (openingReadings.length === 0 || openingReadings.some((reading) => !Number.isFinite(reading.openingValue))) {
      setError("Preencha todas as leituras iniciais.");
      return;
    }

    try {
      await openShiftMutation.mutateAsync({
        unitId: unitId.trim(),
        openingNotes: openingNotes.trim() || undefined,
        openingReadings
      });
      setFeedback("Expediente aberto com sucesso.");
      await refreshOperational();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel abrir o expediente.");
    }
  }

  async function createAttendance(payload: ManualAttendancePayload) {
    setError(null);
    try {
      await manualAttendanceMutation.mutateAsync(payload);
      setFeedback("Atendimento registrado.");
      await refreshOperational();
      if (currentShift?.id) {
        await queryClient.invalidateQueries({ queryKey: ["operator", "shifts", currentShift.id] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel registrar atendimento.");
    }
  }

  async function closeShift(payload: CloseShiftPayload) {
    setError(null);
    if (!currentShift?.id) return;
    try {
      await closeShiftMutation.mutateAsync({ shiftId: currentShift.id, payload });
      setFeedback("Expediente fechado com sucesso.");
      await refreshOperational();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel fechar o expediente.");
    }
  }

  async function attendanceAction(action: () => Promise<unknown>, message: string) {
    setError(null);
    try {
      await action();
      setFeedback(message);
      await refreshOperational();
      if (currentShift?.id) {
        await queryClient.invalidateQueries({ queryKey: ["operator", "shifts", currentShift.id] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar atendimento.");
    }
  }

  if (!allowed) {
    return (
      <Screen>
        <View className="gap-5">
          <Text className="text-3xl font-bold text-uau-black">Operacao da Unidade</Text>
          <EmptyState
            title="Sem permissao"
            description="Esta area e exclusiva para OPERATOR, FRANCHISE_OWNER ou SUPER_ADMIN."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6 pb-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-uau-black">Operacao da Unidade</Text>
          <Text className="text-base leading-6 text-uau-gray">Abertura, contador, atendimentos e fechamento.</Text>
        </View>

        {readingFieldsQuery.isLoading || shiftsQuery.isLoading ? <Loading /> : null}
        {readingFieldsQuery.error || shiftsQuery.error ? (
          <ErrorState message="Nao foi possivel carregar a operacao. Se for 403, confira o perfil do usuario." />
        ) : null}
        {error ? <ErrorState title="Atencao" message={error} /> : null}
        {feedback ? <EmptyState title="Tudo certo" description={feedback} /> : null}

        <Button
          onPress={() => {
            setFeedback(null);
            setError(null);
            void refreshOperational();
          }}
          title="Atualizar"
          variant="ghost"
        />

        {!currentShift ? (
          <Card>
            <View className="gap-4">
              <Text className="text-xl font-bold text-uau-black">Abrir expediente</Text>
              <Input
                label="Unidade"
                onChangeText={setUnitId}
                placeholder="ID da unidade"
                value={unitId}
              />
              <ReadingFieldsForm
                fields={readingFields}
                labelPrefix="Leituras iniciais"
                onChange={(fieldId, value) => setOpeningValues((current) => ({ ...current, [fieldId]: value }))}
                values={openingValues}
              />
              <Input label="Observacao de abertura" onChangeText={setOpeningNotes} value={openingNotes} />
              <Button loading={openShiftMutation.isPending} onPress={() => void openShift()} title="Abrir Expediente" />
            </View>
          </Card>
        ) : (
          <>
            <OperatorShiftCard shift={currentShift} />
            <LiveSummaryCard summary={liveSummaryQuery.data} />
            <AttendanceForm
              loading={manualAttendanceMutation.isPending}
              onSubmit={(payload) => void createAttendance(payload)}
              shiftId={currentShift.id}
            />
            <RecentAttendances
              attendances={attendances}
              loading={completeMutation.isPending || cancelMutation.isPending}
              onCancel={(id) => void attendanceAction(() => cancelMutation.mutateAsync(id), "Atendimento cancelado.")}
              onComplete={(id) => void attendanceAction(() => completeMutation.mutateAsync(id), "Atendimento concluido.")}
            />
            <CloseShiftForm
              fields={readingFields}
              loading={closeShiftMutation.isPending}
              onSubmit={(payload) => void closeShift(payload)}
            />
          </>
        )}

        {closure ? (
          <Card>
            <View className="gap-3">
              <Text className="text-xl font-bold text-uau-black">Fechamento concluido</Text>
              <MoneyRow label="Producao maquina" value={getNumber(asRecord(closure), ["machineProductionTotal"], 0)} />
              <MoneyRow label="Total sistema" value={getNumber(asRecord(closure), ["systemAttendanceTotal"], 0)} />
              <MoneyRow label="Divergencia" value={getNumber(asRecord(closure), ["divergence"], 0)} />
            </View>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

function RecentAttendances({
  attendances,
  loading,
  onComplete,
  onCancel
}: {
  attendances: VehicleAttendance[];
  loading: boolean;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  if (attendances.length === 0) {
    return <EmptyState title="Sem atendimentos recentes" description="Atendimentos do expediente aparecerao aqui quando o endpoint retornar a lista." />;
  }

  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-uau-black">Recentes</Text>
      {attendances.map((attendance) => {
        const record = asRecord(attendance);
        return (
          <Card key={attendance.id}>
            <View className="gap-3">
              <View className="flex-row justify-between gap-3">
                <View>
                  <Text className="text-lg font-bold text-uau-black">{getString(record, ["plate"], "Sem placa")}</Text>
                  <Text className="text-sm text-uau-gray">
                    {getString(record, ["type"], "-")} · {getString(record, ["source"], "-")}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-uau-green">{getString(record, ["status"], "-")}</Text>
              </View>
              <View className="flex-row gap-2">
                <Button loading={loading} onPress={() => onComplete(attendance.id)} title="Concluir" variant="ghost" />
                <Button loading={loading} onPress={() => onCancel(attendance.id)} title="Cancelar" variant="ghost" />
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <MoneyText className="text-sm font-semibold text-uau-black" value={value} />
    </View>
  );
}
