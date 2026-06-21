import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ErrorState } from "@/components/ErrorState";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { Equipment, WorkingHours, getUnit } from "@/features/units/units.api";

const PRIMARY = "#009688";
const FAVORITES_KEY = "favorite_units";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function equipmentBadgeColor(status: Equipment["status"]): { bg: string; text: string } {
  if (status === "AVAILABLE") return { bg: "#D1FAE5", text: "#065F46" };
  if (status === "MAINTENANCE") return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

function equipmentLabel(status: Equipment["status"]): string {
  if (status === "AVAILABLE") return "Disponível";
  if (status === "MAINTENANCE") return "Manutenção";
  return "Indisponível";
}

function SectionTitle({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: "700", color: "#667085", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
      {label}
    </Text>
  );
}

function WorkingHoursRow({ item, todayDow }: { item: WorkingHours; todayDow: number }) {
  const isToday = item.dayOfWeek === todayDow;
  return (
    <View style={{
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
    }}>
      <Text style={{ fontSize: 13, fontWeight: isToday ? "700" : "400", color: isToday ? PRIMARY : "#101418" }}>
        {DAY_NAMES[item.dayOfWeek]}
      </Text>
      <Text style={{ fontSize: 13, color: item.isClosed ? "#EF4444" : isToday ? PRIMARY : "#667085", fontWeight: isToday ? "700" : "400" }}>
        {item.isClosed ? "Fechado" : `${item.openTime} – ${item.closeTime}`}
      </Text>
    </View>
  );
}

function EquipmentRow({ item }: { item: Equipment }) {
  const colors = equipmentBadgeColor(item.status);
  return (
    <View style={{
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
    }}>
      <Text style={{ fontSize: 13, color: "#101418", flex: 1 }}>{item.name}</Text>
      <View style={{ backgroundColor: colors.bg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>
          {equipmentLabel(item.status)}
        </Text>
      </View>
    </View>
  );
}

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const todayDow = new Date().getDay();

  const { data: unit, isLoading, error } = useQuery({
    queryKey: ["franchise-unit", id],
    queryFn: () => getUnit(id!),
    enabled: !!id,
  });

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((raw: string | null) => {
      if (raw && id) {
        const list: string[] = JSON.parse(raw);
        setIsFavorite(list.includes(id));
      }
    });
  }, [id]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite((prev) => {
      const next = !prev;
      AsyncStorage.getItem(FAVORITES_KEY).then((raw: string | null) => {
        const list: string[] = raw ? JSON.parse(raw) : [];
        const updated = next ? [...list, id!] : list.filter((f) => f !== id);
        void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      });
      return next;
    });
  }, [id]);

  const addressLine = [unit?.address, unit?.neighborhood, unit?.city?.name, unit?.state?.uf, unit?.zipCode]
    .filter(Boolean)
    .join(", ");

  return (
    <Screen statusBarStyle="light" scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 24 }}>

        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <ScreenHeader title={unit?.name ?? (isLoading ? "Carregando..." : "Unidade")} />
          </View>
          <TouchableOpacity
            onPress={toggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginTop: 28, marginLeft: 8 }}
          >
            <Ionicons
              name={isFavorite ? "star" : "star-outline"}
              size={22}
              color={isFavorite ? "#F59E0B" : "#667085"}
            />
          </TouchableOpacity>
        </View>

        {error ? <ErrorState message="Não foi possível carregar os dados da unidade." /> : null}

        {/* ── Imagem ou placeholder ── */}
        {isLoading ? (
          <Skeleton style={{ width: "100%", height: 180, borderRadius: 16 }} />
        ) : unit?.imageUrl ? (
          <Image
            source={{ uri: unit.imageUrl }}
            style={{ width: "100%", height: 180, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: "100%", height: 140, borderRadius: 16,
            backgroundColor: "rgba(0,150,136,0.08)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="home-outline" size={48} color={PRIMARY} />
          </View>
        )}

        {/* ── Nome + endereço ── */}
        <View style={{ gap: 6 }}>
          {isLoading ? (
            <>
              <Skeleton style={{ width: "50%", height: 20, borderRadius: 6 }} />
              <Skeleton style={{ width: "80%", height: 14, borderRadius: 6 }} />
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#101418" }}>{unit?.name}</Text>
              {addressLine ? (
                <Text style={{ fontSize: 13, color: "#667085", lineHeight: 20 }}>{addressLine}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* ── Botões de ação ── */}
        {!isLoading && (unit?.latitude && unit?.longitude || unit?.phone) ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            {unit?.latitude && unit?.longitude ? (
              <TouchableOpacity
                onPress={() => void Linking.openURL(`https://maps.google.com/?q=${unit.latitude},${unit.longitude}`)}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 8, paddingVertical: 12, borderRadius: 12,
                  backgroundColor: PRIMARY,
                }}
              >
                <Ionicons name="navigate-outline" size={18} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Rotas</Text>
              </TouchableOpacity>
            ) : null}

            {unit?.phone ? (
              <TouchableOpacity
                onPress={() => void Linking.openURL(`tel:${unit.phone}`)}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 8, paddingVertical: 12, borderRadius: 12,
                  borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: "white",
                }}
              >
                <Ionicons name="call-outline" size={18} color={PRIMARY} />
                <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 14 }}>Ligar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Horário de funcionamento ── */}
        {!isLoading && unit?.workingHours && unit.workingHours.length > 0 ? (
          <View>
            <SectionTitle label="Horário de funcionamento" />
            <View style={{
              backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16,
              borderWidth: 1, borderColor: "#F0F0F0",
            }}>
              {unit.workingHours.map((wh) => (
                <WorkingHoursRow key={wh.dayOfWeek} item={wh} todayDow={todayDow} />
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Status dos equipamentos ── */}
        {!isLoading && unit?.equipments && unit.equipments.length > 0 ? (
          <View>
            <SectionTitle label="Status dos equipamentos" />
            <View style={{
              backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16,
              borderWidth: 1, borderColor: "#F0F0F0",
            }}>
              {unit.equipments.map((eq) => (
                <EquipmentRow key={eq.id} item={eq} />
              ))}
            </View>
          </View>
        ) : null}

      </ScrollView>
    </Screen>
  );
}
