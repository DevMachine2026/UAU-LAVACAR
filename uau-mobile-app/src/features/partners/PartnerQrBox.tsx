import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PartnerQrResult } from "@/features/partners/partners.api";
import { asRecord, getString } from "@/utils/data";

type PartnerQrBoxProps = {
  qr: PartnerQrResult;
};

export function PartnerQrBox({ qr }: PartnerQrBoxProps) {
  const [copied, setCopied] = useState(false);
  const record = asRecord(qr);
  const payload = getString(record, ["qrCodePayload", "payload"]);

  async function copyPayload() {
    if (!payload) return;
    await Clipboard.setStringAsync(payload);
    setCopied(true);
  }

  if (!payload) return null;

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">QR Code / Payload</Text>
        <Text className="text-sm leading-5 text-uau-gray">{payload}</Text>
        <Button onPress={() => void copyPayload()} title={copied ? "Payload copiado" : "Copiar payload"} />
      </View>
    </Card>
  );
}
