import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Share, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useToast } from "@/components/Toast";
import { useMyReferralNetwork, useMyReferralTree } from "@/features/referrals/referrals.hooks";
import { QualificationBadge } from "@/features/referrals/QualificationBadge";
import { ReferralLineSection } from "@/features/referrals/ReferralLineSection";
import { ReferralSummaryCard } from "@/features/referrals/ReferralSummaryCard";
import { ReferralTreeView } from "@/features/referrals/ReferralTreeView";
import { normalizeReferralLine } from "@/features/referrals/referrals.utils";
import { asRecord, getString } from "@/utils/data";

export default function ReferralsScreen() {
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const networkQuery = useMyReferralNetwork();
  const treeQuery = useMyReferralTree();

  const network = asRecord(networkQuery.data);
  const referralCode = getString(network, ["referralCode", "code"], "-");
  const referralLink =
    getString(network, ["referralLink", "link"]) ||
    (referralCode !== "-" ? `https://uau.app/convite/${referralCode}` : "https://uau.app/convite");
  const qualified = Boolean(network.isQualified ?? network.qualified);
  const qualificationLabel = getString(network, ["qualificationStatus", "qualificationReason"]) || undefined;

  const lines = useMemo(
    () => ({
      line1: normalizeReferralLine(network, 1),
      line2: normalizeReferralLine(network, 2),
      line3: normalizeReferralLine(network, 3)
    }),
    [network]
  );

  async function copy(value: string, type: string) {
    await Clipboard.setStringAsync(value);
    setCopied(type);
    toast.show(type === "code" ? "Código copiado!" : "Link copiado!", "success");
  }

  async function shareReferral() {
    await Share.share({
      message: `Baixe o UAU+ Lavacar e ganhe R$21 de bônus! Use meu código: ${referralCode}\nhttps://uau.app/convite/${referralCode}`,
      title: "UAU+ Lavacar",
    });
  }

  const isEmpty =
    !networkQuery.isLoading &&
    !networkQuery.error &&
    referralCode === "-" &&
    lines.line1.length === 0 &&
    lines.line2.length === 0 &&
    lines.line3.length === 0;

  return (
    <Screen statusBarStyle="light">
      <View className="gap-6 pb-6">
        <ScreenHeader
          title="Minha Rede"
          subtitle="Seu código, linhas de indicação e ganhos."
        />

        {networkQuery.isLoading || treeQuery.isLoading ? <Loading /> : null}
        {networkQuery.error || treeQuery.error ? (
          <ErrorState message="Nao foi possivel carregar sua rede agora." />
        ) : null}
        {isEmpty ? (
          <EmptyState title="Rede ainda vazia" description="Compartilhe seu codigo para comecar a formar sua rede." />
        ) : null}

        <Card>
          <View className="gap-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm text-uau-gray">Codigo de indicacao</Text>
                <Text className="mt-1 text-3xl font-bold text-uau-black">{referralCode}</Text>
              </View>
              <QualificationBadge label={qualificationLabel} qualified={qualified} />
            </View>

            <Button
              onPress={() => {
                void copy(referralCode, "code");
              }}
              title={copied === "code" ? "Codigo copiado" : "Copiar codigo"}
            />
            <Button
              onPress={() => void shareReferral()}
              title="Compartilhar"
              variant="ghost"
            />

            <View className="gap-2 rounded-lg bg-uau-light p-3">
              <Text className="text-sm font-semibold text-uau-black">Link fake de indicacao</Text>
              <Text className="text-sm leading-5 text-uau-gray">{referralLink}</Text>
              <Button
                onPress={() => {
                  void copy(referralLink, "link");
                }}
                title={copied === "link" ? "Link copiado" : "Copiar link"}
                variant="ghost"
              />
            </View>
          </View>
        </Card>

        <ReferralSummaryCard network={network} />
        <ReferralLineSection title="Linha 1" users={lines.line1} />
        <ReferralLineSection title="Linha 2" users={lines.line2} />
        <ReferralLineSection title="Linha 3" users={lines.line3} />
        <ReferralTreeView tree={treeQuery.data} />
      </View>
    </Screen>
  );
}
