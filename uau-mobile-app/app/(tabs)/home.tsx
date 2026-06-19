import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useAuthStore } from "@/auth/auth.store";
import { useMyCurrentBilling } from "@/features/billing/billing.hooks";
import { Campaign, clickCampaign, dismissCampaign, viewCampaign } from "@/features/campaigns/campaigns.api";
import { useActiveCampaigns } from "@/features/campaigns/campaigns.hooks";
import { useUnreadNotificationsCount } from "@/features/notifications/notifications.hooks";
import { useMyWallet } from "@/features/wallet/wallet.hooks";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

const SHORTCUTS = [
  { label: "Carteira",   icon: "wallet-outline",     href: "/(tabs)/wallet",   color: "#009688" },
  { label: "Cobranças",  icon: "receipt-outline",     href: "/(tabs)/billing",  color: "#7D1C2F" },
  { label: "Parceiros",  icon: "storefront-outline",  href: "/(tabs)/partners", color: "#7D1C2F" },
  { label: "Minha Rede", icon: "people-outline",      href: "/referrals",       color: "#009688" },
  { label: "Veículos",   icon: "car-outline",         href: "/vehicles",        color: "#009688" },
  { label: "Histórico",  icon: "time-outline",        href: "/history",         color: "#7D1C2F" },
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

function statusColor(status: string): string {
  if (status === "Ativa") return "#0BA95B";
  if (status === "Pendente") return "#F59E0B";
  return "#EF4444";
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

  const hasError = walletQuery.error && billingQuery.error;

  const balance = getNumber(wallet, ["totalBalance", "availableBalance", "balance"], 0);
  const planName = getString(plan, ["name"]);
  const subscriptionStatus = getString(subscription, ["status"]);
  const normalizedStatus = subscriptionStatus ? normalizeSubscriptionStatus(subscriptionStatus) : null;
  const hasBilling = !!billingQuery.data;

  return (
    <Screen statusBarStyle="light">
      <View className="gap-4">

        {/* ── Header ── */}
        <View className="-mx-5 -mt-6 bg-uau-teal px-5 pb-6 pt-4" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          {/* Linha superior: nome + notificações */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white/70 text-sm">Olá,</Text>
              <Text className="text-white text-xl font-bold" numberOfLines={1}>
                {user?.name ?? "cliente"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{ padding: 8, position: "relative" }}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadCount > 0 && (
                <View style={{
                  position: "absolute", top: 4, right: 4,
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: "#EF4444",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Saldo em destaque */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "500", marginBottom: 4 }}>
              Saldo de Cashback
            </Text>
            {walletQuery.isLoading ? (
              <Skeleton style={{ width: 140, height: 32, borderRadius: 6 }} />
            ) : (
              <MoneyText
                value={balance}
                style={{ color: "white", fontSize: 28, fontWeight: "700" }}
              />
            )}

            {/* Linha plano + assinatura */}
            {billingQuery.isLoading ? (
              <Skeleton style={{ width: 160, height: 16, borderRadius: 4, marginTop: 8 }} />
            ) : planName ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Plano {planName}
                </Text>
                {normalizedStatus && (
                  <View style={{
                    backgroundColor: statusColor(normalizedStatus),
                    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
                  }}>
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                      {normalizedStatus}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 8 }}>
                Sem plano ativo
              </Text>
            )}
          </View>
        </View>

        {hasError && (
          <ErrorState message="Alguns dados não puderam ser carregados." />
        )}

        {/* ── CTA principal ── */}
        <TouchableOpacity
          onPress={() => router.push(hasBilling ? "/(tabs)/billing" : "/subscribe")}
          activeOpacity={0.85}
          style={{ borderRadius: 99, overflow: "hidden" }}
        >
          <LinearGradient
            colors={hasBilling ? ["#7D1C2F", "#9B2335"] : ["#00B5A4", "#009688"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 24,
            }}
          >
            <Ionicons name={hasBilling ? "card-outline" : "star-outline"} size={18} color="white" />
            <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
              {hasBilling ? "Pagar cobrança atual" : "Assinar agora"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Atalhos rápidos (grid 3×2 compacto) ── */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#667085", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Acesso rápido
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {SHORTCUTS.map(({ label, icon, href, color }) => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push(href)}
                style={{
                  width: "30%",
                  flexGrow: 1,
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 14,
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#F0F0F0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: color + "18",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#101418", textAlign: "center" }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Campanhas ── */}
        {campaigns.length > 0 && (
          <View className="gap-3">
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#667085", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Novidades
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {campaigns.map((campaign) => (
                <View key={campaign.id} style={{
                  width: 280, backgroundColor: "white", borderRadius: 16,
                  padding: 16, borderWidth: 1, borderColor: "#F0F0F0",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#101418" }}>{campaign.title}</Text>
                  {campaign.subtitle ? (
                    <Text style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>{campaign.subtitle}</Text>
                  ) : null}
                  {campaign.body ? (
                    <Text style={{ fontSize: 13, color: "#667085", lineHeight: 20, marginTop: 8 }}>{campaign.body}</Text>
                  ) : null}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                    {campaign.ctaLabel ? (
                      <Button onPress={() => clickMutation.mutate(campaign.id)} title={campaign.ctaLabel} />
                    ) : null}
                    <Button onPress={() => dismissMutation.mutate(campaign.id)} title="Fechar" variant="ghost" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </View>
    </Screen>
  );
}
