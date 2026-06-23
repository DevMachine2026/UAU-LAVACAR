import { Card } from "@/components/Card";
import { formatCurrency } from "@/utils/format";

type MetricCardProps = {
  label: string;
  value: number | string;
  money?: boolean;
};

export function MetricCard({ label, value, money = false }: MetricCardProps) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-uau-gray">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-uau-black">
        {money ? formatCurrency(value) : value}
      </p>
    </Card>
  );
}
