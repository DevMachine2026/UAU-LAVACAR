import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

type MetricCardProps = {
  label: string;
  value: number | string;
  money?: boolean;
  icon?: LucideIcon;
  alert?: boolean;
};

export function MetricCard({
  label,
  value,
  money = false,
  icon: Icon,
  alert = false,
}: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-uau-gray">{label}</p>
        {Icon && (
          <div
            className={cn(
              "rounded-full p-2",
              alert ? "bg-amber-50 text-amber-500" : "bg-uau-primary/10 text-uau-primary",
            )}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className={cn("mt-2 text-2xl font-bold", money ? "text-uau-primary" : "text-uau-black")}>
        {money ? formatCurrency(value) : value}
      </p>
    </Card>
  );
}
