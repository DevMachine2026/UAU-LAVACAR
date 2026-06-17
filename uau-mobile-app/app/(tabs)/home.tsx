import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/Button";
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

const TEAL_GRADIENT = ["#009B8D", "#00695C"] as const;
const MAROON_GRADIENT = ["#7D1C2F", "#1A0010"] as const;

const SHORTCUTS = [
  { label: "Minha Carteira", icon: "wallet-outline",    href: "/(tabs)/wallet",   gradient: TEAL_GRADIENT },
  { label: "Cobranças",      icon: "receipt-outline",   href: "/(tabs)/billing",  gradient: MAROON_GRADIENT },
  { label: "Parceiros",      icon: "storefront-outline",href: "/(tabs)/partners", gradient: MAROON_GRADIENT },
  { label: "Minha Rede",     icon: "people-outline",    href: "/referrals",       gradient: TEAL_GRADIENT },
  { label: "Meus Veículos",  icon: "car-outline",       href: "/vehicles",        gradient: TEAL_GRADIENT },
  { label: "Histórico",      icon: "time-outline",      href: "/history",         gradient: MAROON_GRADIENT },
] as const;

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

function normalizeSubscriptionStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("ativ")) return "Ativa";
  if (s.includes("pend") || s.includes("aguard")) return "Pendente";
  if (s.includes("venc") || s.includes("atras") || s.includes("cancel")) return "Vencida";
  return status;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns", "active"] }),
  });

  const viewMutateRef = useRef(viewMutation.mutate);
  viewMutateRef.current = viewMutation.mutate;

  useEffect(() => {
    campaigns.forEach((campaign) => {
      if (!campaign.id || viewedCampaigns.current.has(campaign.id)) return;
      viewedCampaigns.current.add(campaign.id);
      viewMutateRef.current(campaign.id);
    });
  }, [campaigns]);

  const isLoading = walletQuery.isLoading || billingQuery.isLoading || campaignsQuery.isLoading || unreadQuery.isLoading;
  const hasError = walletQuery.error || billingQuery.error || campaignsQuery.error || unreadQuery.error;

  const planName = getString(plan, ["name"]);
  const subscriptionStatus = getString(subscription, ["status"]);
  const headerSubtitle = planName
    ? `Plano ${planName} · ${normalizeSubscriptionStatus(subscriptionStatus)}`
    : "Seu UAU+ em um só lugar.";

  return (
    <Screen statusBarStyle="light">
      <View className="gap-5">
        {/* Header teal */}
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-2xl font-bold text-white">
                Olá, {user?.name ?? "cliente"}
              </Text>
              <Text className="text-sm text-white/80">{headerSubtitle}</Text>
            </View>
            <Pressable
              className="relative p-2"
              onPress={() => router.push("/notifications")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadCount > 0 && (
                <View className="absolute right-1 top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <Text className="text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {isLoading ? <Loading /> : null}
        {hasError ? <ErrorState message="Alguns dados da Home não puderam ser carregados agora." /> : null}

        {/* Stats Row */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl border border-gray-100 bg-white p-3">
            <Text className="text-xs font-semibold text-uau-teal">Cashback</Text>
            <MoneyText
              className="mt-1 text-lg font-bold text-uau-black"
              value={getNumber(wallet, ["totalBalance", "availableBalance", "balance"], 0)}
            />
          </View>
          <View className="flex-1 rounded-xl border border-gray-100 bg-white p-3">
            <Text className="text-xs font-semibold text-uau-teal">Veículos</Text>
            <Text className="mt-1 text-lg font-bold text-uau-black">—</Text>
          </View>
          <View className="flex-1 rounded-xl border border-gray-100 bg-white p-3">
            <Text className="text-xs font-semibold text-uau-teal">Assinatura</Text>
            <Text className="mt-1 text-lg font-bold text-uau-black" numberOfLines={1}>
              {subscriptionStatus ? normalizeSubscriptionStatus(subscriptionStatus) : "—"}
            </Text>
          </View>
        </View>

        {/* CTA Pill Preto */}
        <Pressable
          className="h-14 items-center justify-center rounded-full bg-uau-black"
          onPress={() => {
            if (billingQuery.data) {
              router.push("/(tabs)/billing");
            } else {
              router.push("/subscribe");
            }
          }}
        >
          <Text className="text-base font-semibold text-white">
            {billingQuery.data ? "Pagar cobrança atual" : "Assinar agora"}
          </Text>
        </Pressable>

        {/* Cards de Ação */}
        <View className="flex-row flex-wrap gap-3">
          {SHORTCUTS.map(({ label, icon, href, gradient }) => (
            <Pressable
              key={label}
              className="overflow-hidden rounded-2xl"
              style={({ pressed }) => ({ width: "48%", aspectRatio: 1, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
              onPress={() => router.push(href)}
            >
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}
              >
                <Ionicons name={icon as any} size={40} color="white" />
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 13, marginTop: 12, textAlign: "center" }}
                >
                  {label}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Campanhas (ao final, se houver) */}
        {campaigns.length > 0 ? (
          <View className="gap-3">
            <Text className="text-xl font-bold text-uau-black">Campanhas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {campaigns.map((campaign) => (
                  <View key={campaign.id} className="w-72 rounded-lg border border-gray-200 bg-white p-4">
                    <Text className="text-lg font-bold text-uau-black">{campaign.title}</Text>
                    {campaign.subtitle ? (
                      <Text className="mt-1 text-sm text-uau-gray">{campaign.subtitle}</Text>
                    ) : null}
                    {campaign.body ? (
                      <Text className="mt-3 text-sm leading-5 text-uau-gray">{campaign.body}</Text>
                    ) : null}
                    <View className="mt-4 flex-row gap-2">
                      {campaign.ctaLabel ? (
                        <Button
                          onPress={() => clickMutation.mutate(campaign.id)}
                          title={campaign.ctaLabel}
                        />
                      ) : null}
                      <Button
                        onPress={() => dismissMutation.mutate(campaign.id)}
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
        </View>
      </Screen>
  );
}
