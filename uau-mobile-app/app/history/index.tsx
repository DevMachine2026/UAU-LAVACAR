import { Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { SkeletonList } from "@/components/Skeleton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
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
    <Screen
      onRefresh={() => void attendancesQuery.refetch()}
      refreshing={attendancesQuery.isFetching}
      statusBarStyle="light"
    >
      <View className="gap-6">
        <ScreenHeader
          title="Histórico"
          subtitle="Lavagens e atendimentos registrados pelo caixa ou câmera."
        />

        {attendancesQuery.isLoading ? <SkeletonList count={4} /> : null}
        {attendancesQuery.error ? <ErrorState message="Não foi possível carregar seu histórico agora." /> : null}
        {attendances.length === 0 && !attendancesQuery.isLoading ? (
          <EmptyState
            title="Histórico vazio"
            description="Seu histórico de lavagens aparecerá aqui assim que sua unidade registrar atendimentos pelo caixa ou câmera."
          />
        ) : null}

        {attendances.map((attendance) => (
          <HistoryCard item={attendance} key={attendance.id} />
        ))}
      </View>
    </Screen>
  );
}
