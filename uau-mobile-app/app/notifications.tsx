import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { markAllAsRead, markAsRead } from "@/features/notifications/notifications.api";
import { useMyNotifications } from "@/features/notifications/notifications.hooks";
import { asArray, asRecord, getString } from "@/utils/data";

function normalizeNotifications(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data);
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useMyNotifications();
  const notifications = normalizeNotifications(notificationsQuery.data);

  const refreshNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const readMutation = useMutation({ mutationFn: markAsRead, onSuccess: refreshNotifications });
  const readAllMutation = useMutation({ mutationFn: markAllAsRead, onSuccess: refreshNotifications });

  return (
    <Screen>
      <View className="gap-5">
        <View className="flex-row items-center justify-between gap-4">
          <Text className="text-3xl font-bold text-uau-black">Notificacoes</Text>
          <Button
            loading={readAllMutation.isPending}
            onPress={() => readAllMutation.mutate()}
            title="Ler todas"
            variant="ghost"
          />
        </View>

        {notificationsQuery.isLoading ? <Loading /> : null}
        {notificationsQuery.error ? <ErrorState message="Nao foi possivel carregar suas notificacoes." /> : null}

        {notifications.length === 0 && !notificationsQuery.isLoading ? (
          <EmptyState title="Nada novo por aqui" description="Suas notificacoes do UAU+ aparecerao nesta tela." />
        ) : null}

        {notifications.map((item, index) => {
          const notification = asRecord(item);
          const id = getString(notification, ["id"], String(index));
          const readAt = getString(notification, ["readAt"]);

          return (
            <Card key={id}>
              <View className="gap-3">
                <View className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-uau-black">
                      {getString(notification, ["title"], "Notificacao")}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-uau-gray">{getString(notification, ["body"], "")}</Text>
                  </View>
                  {!readAt ? <View className="mt-1 h-3 w-3 rounded-full bg-uau-green" /> : null}
                </View>
                <DateText className="text-xs text-uau-gray" value={getString(notification, ["createdAt"])} />
                {!readAt ? (
                  <Button
                    loading={readMutation.isPending}
                    onPress={() => readMutation.mutate(id)}
                    title="Marcar como lida"
                    variant="ghost"
                  />
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
