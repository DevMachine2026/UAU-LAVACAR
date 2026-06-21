import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { FranchiseUnit, getUnits } from "@/features/units/units.api";

const PRIMARY = "#009688";
const FAVORITES_KEY = "favorite_units";

function UnitSkeleton() {
  return (
    <View style={{
      backgroundColor: "white", borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: "#F0F0F0",
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
      gap: 8,
    }}>
      <Skeleton style={{ width: "60%", height: 16, borderRadius: 6 }} />
      <Skeleton style={{ width: "80%", height: 12, borderRadius: 6 }} />
    </View>
  );
}

function UnitCard({
  unit,
  isFavorite,
  onToggleFavorite,
}: {
  unit: FranchiseUnit;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const subtitle = [unit.neighborhood, unit.city?.name].filter(Boolean).join(" · ");

  return (
    <TouchableOpacity
      onPress={() => router.push(`/units/${unit.id}` as any)}
      activeOpacity={0.85}
      style={{
        backgroundColor: "white", borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: "#F0F0F0",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "rgba(0,150,136,0.09)",
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name="business-outline" size={22} color={PRIMARY} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#101418" }}>{unit.name}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => onToggleFavorite(unit.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isFavorite ? "star" : "star-outline"}
          size={20}
          color={isFavorite ? "#F59E0B" : "#D0D5DD"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function UnitsScreen() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["franchise-units"],
    queryFn: getUnits,
  });

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((raw: string | null) => {
      if (raw) setFavorites(JSON.parse(raw) as string[]);
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeUnits = (data ?? []).filter((u) => u.isActive);

  return (
    <Screen statusBarStyle="light">
      <View style={{ gap: 16 }}>
        <ScreenHeader title="Unidades" subtitle="Encontre a unidade mais próxima de você." />

        {error ? <ErrorState message="Não foi possível carregar as unidades." /> : null}

        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => <UnitSkeleton key={i} />)}
          </View>
        ) : !isLoading && activeUnits.length === 0 && !error ? (
          <EmptyState
            title="Nenhuma unidade disponível"
            description="Em breve haverá unidades disponíveis na sua região."
          />
        ) : (
          <FlatList
            data={activeUnits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UnitCard
                unit={item}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            scrollEnabled={false}
          />
        )}
      </View>
    </Screen>
  );
}
