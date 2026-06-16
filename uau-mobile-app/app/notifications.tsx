import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";
import { Loading } from "@/components/Loading";
import { SkeletonList } from "@/components/Skeleton";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
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

  const unreadCount = notifications.filter((n) => !getString(asRecord(n), ["readAt"])).length;

  return (
    <Screen
      onRefresh={refreshNotifications}
      refreshing={notificationsQuery.isFetching}
      statusBarStyle="light"
    >
      <View className="gap-5">
        <ScreenHeader
          title="Notificações"
          subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
        />
        {unreadCount > 0 ? (
          <View className="items-end">
            <Button
              loading={readAllMutation.isPending}
              onPress={() => readAllMutation.mutate()}
              title="Ler todas"
              variant="ghost"
            />
          </View>
        ) : null}

        {notificationsQuery.isLoading ? <SkeletonList count={5} /> : null}
        {notificationsQuery.error ? (
          <ErrorState message="Não foi possível carregar suas notificações." />
        ) : null}

        {notifications.length === 0 && !notificationsQuery.isLoading ? (
          <EmptyState title="Nada novo por aqui" description="Suas notificações do UAU+ aparecerão nesta tela." />
        ) : null}

        {notifications.map((item, index) => {
          const notification = asRecord(item);
          const id = getString(notification, ["id"], String(index));
          const readAt = getString(notification, ["readAt"]);

          return (
            <FadeInView key={id} index={index}>
            <Card>
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <Text className={`text-base font-semibold ${readAt ? "text-uau-gray" : "text-uau-black"}`}>
                      {getString(notification, ["title"], "Notificação")}
                    </Text>
                    <Text className="text-sm leading-5 text-uau-gray">
                      {getString(notification, ["body"], "")}
                    </Text>
                  </View>
                  {!readAt ? (
                    <View className="mt-1 h-2.5 w-2.5 rounded-full bg-uau-teal" />
                  ) : null}
                </View>
                <View className="flex-row items-center justify-between">
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
              </View>
            </Card>
            </FadeInView>
          );
        })}
      </View>
    </Screen>
  );
}
