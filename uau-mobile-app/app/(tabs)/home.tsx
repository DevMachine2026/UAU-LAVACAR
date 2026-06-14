import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";
import { useMyCurrentBilling } from "@/features/billing/billing.hooks";
import { Campaign, clickCampaign, dismissCampaign, viewCampaign } from "@/features/campaigns/campaigns.api";
import { useActiveCampaigns } from "@/features/campaigns/campaigns.hooks";
import { useUnreadNotificationsCount } from "@/features/notifications/notifications.hooks";
import { useMyWallet } from "@/features/wallet/wallet.hooks";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

function normalizeCount(value: unknown) {
  if (typeof value === "number") return value;
  const record = asRecord(value);
  return getNumber(record, ["count", "unreadCount"], 0);
}

function normalizeCampaigns(value: unknown) {
  if (Array.isArray(value)) return value as Campaign[];
  const record = asRecord(value);
  return asArray<Campaign>(record.items ?? record.data);
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const viewedCampaigns = useRef(new Set<string>());

  const walletQuery = useMyWallet();
  const billingQuery = useMyCurrentBilling();
  const campaignsQuery = useActiveCampaigns();
  const unreadQuery = useUnreadNotificationsCount();

  const campaigns = useMemo(() => normalizeCampaigns(campaignsQuery.data), [campaignsQuery.data]);
  const unreadCount = normalizeCount(unreadQuery.data);
  const wallet = asRecord(walletQuery.data);
  const billing = asRecord(billingQuery.data);
  const subscription = getNestedRecord(billing, ["subscription"]);
  const plan = getNestedRecord(subscription, ["plan"]);

  const viewMutation = useMutation({ mutationFn: viewCampaign });
  const clickMutation = useMutation({ mutationFn: clickCampaign });
  const dismissMutation = useMutation({
    mutationFn: dismissCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns", "active"] })
  });

  useEffect(() => {
    campaigns.forEach((campaign) => {
      if (!campaign.id || viewedCampaigns.current.has(campaign.id)) return;
      viewedCampaigns.current.add(campaign.id);
      viewMutation.mutate(campaign.id);
    });
  }, [campaigns, viewMutation]);

  const isLoading = walletQuery.isLoading || billingQuery.isLoading || campaignsQuery.isLoading || unreadQuery.isLoading;
  const hasError = walletQuery.error || billingQuery.error || campaignsQuery.error || unreadQuery.error;

  return (
    <Screen>
      <View className="gap-6">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-3xl font-bold text-uau-black">Olá, {user?.name ?? "cliente"}</Text>
            <Text className="text-base text-uau-gray">
              {getString(subscription, ["status"], "Seu UAU+ em um só lugar.")}
            </Text>
            {getString(plan, ["name"]) ? <Text className="text-sm text-uau-gray">Plano {getString(plan, ["name"])}</Text> : null}
          </View>

          <Pressable
            className="min-h-12 min-w-12 items-center justify-center rounded-lg bg-uau-black px-3"
            onPress={() => router.push("/notifications")}
          >
            <Text className="text-xs font-semibold text-white">Avisos</Text>
            {unreadCount > 0 ? <Text className="text-xs font-bold text-uau-green">{unreadCount}</Text> : null}
          </Pressable>
        </View>

        {isLoading ? <Loading /> : null}
        {hasError ? <ErrorState message="Alguns dados da Home não puderam ser carregados agora." /> : null}

        <Button
          onPress={() => {
            if (billingQuery.data) {
              router.push("/(tabs)/billing");
              return;
            }
            router.push("/subscribe");
          }}
          title={billingQuery.data ? "Pagar cobrança atual" : "Assinar agora"}
        />

        <View className="gap-3">
          <View className="flex-row gap-3">
            <Card>
              <Text className="text-sm text-uau-gray">Cashback total</Text>
              <MoneyText
                className="mt-2 text-2xl font-bold text-uau-black"
                value={getNumber(wallet, ["totalBalance", "availableBalance", "balance"], 0)}
              />
            </Card>
            <Card>
              <Text className="text-sm text-uau-gray">Promocional</Text>
              <MoneyText
                className="mt-2 text-2xl font-bold text-uau-black"
                value={getNumber(wallet, ["promotionalBalance", "promoBalance"], 0)}
              />
            </Card>
          </View>

          <Card>
            <View className="gap-3">
              <Text className="text-lg font-semibold text-uau-black">Cobrança atual</Text>
              {billingQuery.data ? (
                <>
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-uau-gray">Status</Text>
                    <Text className="text-sm font-semibold text-uau-black">{getString(billing, ["status"], "-")}</Text>
                  </View>
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-uau-gray">Valor a pagar</Text>
                    <MoneyText
                      className="text-sm font-semibold text-uau-black"
                      value={getNumber(billing, ["gatewayAmount", "amount", "totalAmount"], 0)}
                    />
                  </View>
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-uau-gray">Vencimento</Text>
                    <DateText className="text-sm font-semibold text-uau-black" value={getString(billing, ["dueDate"])} />
                  </View>
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-uau-gray">Pagamento</Text>
                    <Text className="text-sm font-semibold text-uau-black">
                      {getString(billing, ["paymentMethod"], "-")}
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="text-sm text-uau-gray">Nenhuma cobrança atual encontrada.</Text>
              )}
            </View>
          </Card>
        </View>

        {campaigns.length > 0 ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-uau-black">Campanhas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {campaigns.map((campaign) => (
                  <View key={campaign.id} className="w-72 rounded-lg border border-gray-200 bg-white p-4">
                    <Text className="text-lg font-bold text-uau-black">{campaign.title}</Text>
                    {campaign.subtitle ? <Text className="mt-1 text-sm text-uau-gray">{campaign.subtitle}</Text> : null}
                    {campaign.body ? <Text className="mt-3 text-sm leading-5 text-uau-gray">{campaign.body}</Text> : null}
                    <View className="mt-4 flex-row gap-2">
                      {campaign.ctaLabel ? (
                        <Button
                          onPress={() => {
                            clickMutation.mutate(campaign.id);
                          }}
                          title={campaign.ctaLabel}
                        />
                      ) : null}
                      <Button
                        onPress={() => {
                          dismissMutation.mutate(campaign.id);
                        }}
                        title="Fechar"
                        variant="ghost"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-xl font-bold text-uau-black">Atalhos</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              ["Assinar agora", billingQuery.data ? "/(tabs)/billing" : "/subscribe"],
              ["Minhas Cobranças", "/(tabs)/billing"],
              ["Minha Carteira", "/(tabs)/wallet"],
              ["Parceiros", "/(tabs)/partners"],
              ["Minha Rede", "/referrals"],
              ["Meus Veículos", "/vehicles"],
              ["Histórico", "/history"],
              ["Perfil", "/(tabs)/profile"]
            ].map(([title, href]) => (
              <Pressable
                className="min-h-12 min-w-[47%] flex-1 justify-center rounded-lg border border-gray-200 bg-white px-4"
                key={title}
                onPress={() => router.push(href)}
              >
                <Text className="font-semibold text-uau-black">{title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
