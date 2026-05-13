import { Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { HistoryCard } from "@/features/history/HistoryCard";
import { useMyAttendances } from "@/features/history/history.hooks";
import { AttendanceHistoryItem } from "@/features/history/history.api";
import { asArray, asRecord } from "@/utils/data";

function normalizeAttendances(value: unknown) {
  if (Array.isArray(value)) return value as AttendanceHistoryItem[];
  const record = asRecord(value);
  return asArray<AttendanceHistoryItem>(record.items ?? record.data);
}

export default function HistoryScreen() {
  const attendancesQuery = useMyAttendances();
  const attendances = normalizeAttendances(attendancesQuery.data);

  return (
    <Screen>
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-uau-black">Historico</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Lavagens e atendimentos registrados pelo caixa operacional ou camera.
          </Text>
        </View>

        {attendancesQuery.isLoading ? <Loading /> : null}
        {attendancesQuery.error ? <ErrorState message="Nao foi possivel carregar seu historico agora." /> : null}
        {attendances.length === 0 && !attendancesQuery.isLoading ? (
          <EmptyState
            title="Historico vazio"
            description="Seu historico de lavagens aparecera aqui assim que sua unidade registrar atendimentos pelo caixa ou camera."
          />
        ) : null}

        {attendances.map((attendance) => (
          <HistoryCard item={attendance} key={attendance.id} />
        ))}
      </View>
    </Screen>
  );
}
