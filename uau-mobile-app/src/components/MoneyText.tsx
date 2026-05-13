import { Text, TextProps } from "react-native";
import { formatCurrency } from "@/utils/format";

type MoneyTextProps = TextProps & {
  value: number | string | null | undefined;
};

export function MoneyText({ value, ...props }: MoneyTextProps) {
  return <Text {...props}>{formatCurrency(value)}</Text>;
}
