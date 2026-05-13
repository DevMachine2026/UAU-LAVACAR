import { Text, TextProps } from "react-native";
import { formatDate } from "@/utils/format";

type DateTextProps = TextProps & {
  value: string | Date | null | undefined;
};

export function DateText({ value, ...props }: DateTextProps) {
  return <Text {...props}>{formatDate(value)}</Text>;
}
