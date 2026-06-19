import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useMyReferralNetwork } from "@/features/referrals/referrals.hooks";
import { getMyStatement } from "@/features/wallet/wallet.api";
import { useMyWallet } from "@/features/wallet/wallet.hooks";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

const PRIMARY = "#009688";
const AMBER   = "#F59E0B";
const TINT    = "#F0FBF9";

function calcDiasRestantesBônus(grantedAt: string): number {
  return 7 - Math.floor((Date.now() - new Date(grantedAt).getTime()) / 86400000);
}

const SHORTCUTS = [
  { label: "Carteira",   icon: "wallet-outline",  href: "/(tabs)/wallet"  },
  { label: "Cobranças",  icon: "receipt-outline", href: "/(tabs)/billing" },
  { label: "Veículos",   icon: "car-outline",     href: "/vehicles"       },
  { label: "Minha Rede", icon: "people-outline",  href: "/referrals"      },
] as const;

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

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
  if (status === "Pendente") return AMBER;
  return "#EF4444";
}

type Step = { label: string; description: string; icon: string; href: string; done: boolean };

function OnboardingSteps({
  hasPlan,
  hasBalance,
  welcomeBonus,
}: {
  hasPlan: boolean;
  hasBalance: boolean;
  welcomeBonus: number;
}) {
  const steps: Step[] = [
    {
      label: "Crie sua conta",
      description: "Você já está dentro!",
      icon: "checkmark-circle",
      href: "",
      done: true,
    },
    {
      label: "Assine um plano",
      description: hasPlan
        ? "Plano ativo"
        : welcomeBonus > 0
        ? `Use seu bônus de R$${welcomeBonus.toFixed(0)} para assinar`
        : "Escolha o plano ideal para você",
      icon: "star-outline",
      href: "/subscribe",
      done: hasPlan,
    },
    {
      label: "Cadastre seu veículo",
      description: "Associe seu carro para fazer check-ins",
      icon: "car-outline",
      href: "/vehicles",
      done: false,
    },
    {
      label: "Ganhe cashback",
      description: hasBalance ? "Você já tem saldo!" : "Faça check-ins e acumule saldo",
      icon: "wallet-outline",
      href: "/(tabs)/wallet",
      done: hasBalance,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) return null;

  const pct = Math.round((completedCount / steps.length) * 100);
  const firstPendingIndex = steps.findIndex((s) => !s.done);

  return (
    <View style={{
      backgroundColor: "white", borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: "#F0F0F0",
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#101418" }}>Primeiros passos</Text>
          <Text style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{completedCount} de {steps.length} concluídos</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: PRIMARY }}>{pct}%</Text>
      </View>

      <View style={{ height: 4, backgroundColor: "#F0F0F0", borderRadius: 99, marginBottom: 16 }}>
        <View style={{ height: 4, backgroundColor: PRIMARY, borderRadius: 99, width: `${pct}%` }} />
      </View>

      <View style={{ gap: 8 }}>
        {steps.map((step, i) => {
          const isActive  = !step.done && i === firstPendingIndex;
          const isPending = !step.done && i !== firstPendingIndex;

          return (
            <TouchableOpacity
              key={i}
              disabled={step.done || !step.href}
              onPress={() => step.href && router.push(step.href as any)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                padding: 10, borderRadius: 12,
                backgroundColor: step.done ? TINT : isActive ? "rgba(245,158,11,0.06)" : "#FAFAFA",
                opacity: isPending ? 0.6 : step.done ? 0.75 : 1,
              }}
            >
              {step.done ? (
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: PRIMARY,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="checkmark" size={18} color="white" />
                </View>
              ) : isActive ? (
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: AMBER,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={step.icon as any} size={18} color="white" />
                </View>
              ) : (
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  borderWidth: 1.5, borderColor: "#D0D5DD",
                  backgroundColor: "#F5F5F5",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={step.icon as any} size={18} color="#667085" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13, fontWeight: "600",
                  color: step.done ? PRIMARY : isActive ? "#101418" : "#667085",
                  textDecorationLine: step.done ? "line-through" : "none",
                }}>
                  {step.label}
                </Text>
                <Text style={{ fontSize: 11, color: isActive ? AMBER : "#667085", marginTop: 1 }}>
                  {step.description}
                </Text>
              </View>

              {!step.done && step.href && (
                <Ionicons name="chevron-forward" size={16} color={isActive ? AMBER : "#D0D5DD"} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const viewedCampaigns = useRef(new Set<string>());

  const walletQuery    = useMyWallet();
  const billingQuery   = useMyCurrentBilling();
  const campaignsQuery = useActiveCampaigns();
  const unreadQuery    = useUnreadNotificationsCount();
  const referralQuery  = useMyReferralNetwork();

  const wallet = asRecord(walletQuery.data);
  const welcomeBonusBalance = getNumber(wallet, ["welcomeBonusBalance"], 0);

  // Busca statement só quando há bônus — para calcular dias restantes reais
  const statementQuery = useQuery({
    queryKey: ["wallet", "statement"],
    queryFn: getMyStatement,
    enabled: walletQuery.isSuccess && welcomeBonusBalance > 0,
  });

  const bonusGrantedAt = useMemo(() => {
    if (!statementQuery.data) return null;
    const item = statementQuery.data.find((i) => i.origin === "WELCOME_BONUS");
    return item?.createdAt ?? null;
  }, [statementQuery.data]);

  const diasRestantes = bonusGrantedAt ? calcDiasRestantesBônus(bonusGrantedAt) : 7;

  const campaigns     = useMemo(() => normalizeCampaigns(campaignsQuery.data), [campaignsQuery.data]);
  const unreadCount   = normalizeCount(unreadQuery.data);
  const billing       = asRecord(billingQuery.data);
  const subscription  = getNestedRecord(billing, ["subscription"]);
  const plan          = getNestedRecord(subscription, ["plan"]);
  const referralNetwork = asRecord(referralQuery.data);

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

  const balance      = getNumber(wallet, ["totalBalance", "availableBalance", "balance"], 0);
  const promoBalance = getNumber(wallet, ["promoBalance", "promotionalBalance"], 0);
  const planName     = getString(plan, ["name"]);
  const subscriptionStatus  = getString(subscription, ["status"]);
  const normalizedStatus    = subscriptionStatus ? normalizeSubscriptionStatus(subscriptionStatus) : null;
  const hasActivePlan       = !!planName && normalizedStatus === "Ativa";
  const hasBilling          = !!billingQuery.data;
  const dueDate             = getString(billing, ["dueDate"]);
  const referralCode        = getString(referralNetwork, ["referralCode", "referral_code"]);

  // Prioridade do card no header — bônus só aparece se ainda não expirou
  const headerMode = welcomeBonusBalance > 0 && diasRestantes > 0
    ? "bonus"
    : (balance + promoBalance) > 0
    ? "cashback"
    : "empty";

  return (
    <Screen statusBarStyle="light">
      <View className="gap-4">

        {/* ── Header ── */}
        <View className="-mx-5 -mt-6 bg-uau-teal px-5 pb-6 pt-4" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          {/* Nome + notificações */}
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

          {/* Card de saldo — prioridade: bônus > cashback > vazio */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
            {headerMode === "bonus" ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Ionicons name="gift-outline" size={12} color={AMBER} />
                  <Text style={{ color: AMBER, fontSize: 12, fontWeight: "600" }}>
                    Bônus de boas-vindas
                  </Text>
                </View>
                {walletQuery.isLoading ? (
                  <Skeleton style={{ width: 140, height: 32, borderRadius: 6 }} />
                ) : (
                  <MoneyText
                    value={welcomeBonusBalance}
                    style={{ color: "white", fontSize: 28, fontWeight: "700" }}
                  />
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <Ionicons name="time-outline" size={12} color={diasRestantes === 1 ? "#D97706" : AMBER} />
                  <Text style={{
                    color: diasRestantes === 1 ? "#D97706" : AMBER,
                    fontSize: 11,
                    fontWeight: diasRestantes === 1 ? "700" : "500",
                  }}>
                    {diasRestantes === 1
                      ? "Expira amanhã! · use na sua assinatura"
                      : `Expira em ${diasRestantes} dias · use na sua assinatura`}
                  </Text>
                </View>
              </>
            ) : headerMode === "cashback" ? (
              <>
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
                ) : null}
              </>
            ) : (
              /* Sem bônus e sem saldo — não mostra zeros */
              <>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "500", marginBottom: 8 }}>
                  {planName ? `Plano ${planName}` : "Nenhum plano ativo"}
                </Text>
                <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
                  Assine e comece a ganhar
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
                  Ganhe cashback em cada lavagem
                </Text>
              </>
            )}
          </View>
        </View>

        {hasError && (
          <ErrorState message="Alguns dados não puderam ser carregados." />
        )}

        {/* ── CTA contextual ── */}
        {hasActivePlan ? (
          /* Com plano ativo: card de status */
          <View style={{
            backgroundColor: "white", borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: "#E8F5F3",
            flexDirection: "row", alignItems: "center", gap: 12,
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: TINT,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#101418" }}>
                Plano {planName}
              </Text>
              <Text style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                {dueDate ? `Ativo até ${formatShortDate(dueDate)}` : "Plano ativo"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/billing")}>
              <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        ) : (
          /* Sem plano ativo: card CTA para assinar */
          <TouchableOpacity
            onPress={() => router.push(hasBilling ? "/(tabs)/billing" : "/subscribe")}
            activeOpacity={0.88}
            style={{ backgroundColor: PRIMARY, borderRadius: 16, padding: 16, gap: 2 }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" }}>
              {welcomeBonusBalance > 0 ? "Use seu bônus agora" : hasBilling ? "Cobrança pendente" : "Comece hoje"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>
                {hasBilling ? "Pagar cobrança atual" : "Assinar um plano"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Atalhos rápidos — barra horizontal 4 itens ── */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#667085", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Acesso rápido
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {SHORTCUTS.map(({ label, icon, href }) => (
              <TouchableOpacity
                key={label}
                onPress={() => router.push(href)}
                style={{
                  flex: 1,
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 12,
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
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: "rgba(0, 150, 136, 0.09)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={icon as any} size={20} color={PRIMARY} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#101418", textAlign: "center" }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Card de indicação — só aparece se tem referralCode ── */}
        {!!referralCode && (
          <TouchableOpacity
            onPress={() => router.push("/referrals")}
            activeOpacity={0.88}
            style={{
              backgroundColor: TINT,
              borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: "rgba(0, 150, 136, 0.19)",
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: "rgba(0, 150, 136, 0.12)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="people-outline" size={22} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#101418" }}>
                Indique e ganhe R$10
              </Text>
              <Text style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                A cada amigo que assinar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
          </TouchableOpacity>
        )}

        {/* ── Primeiros passos (onboarding) ── */}
        <OnboardingSteps
          hasPlan={hasActivePlan}
          hasBalance={balance > 0}
          welcomeBonus={welcomeBonusBalance}
        />

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
