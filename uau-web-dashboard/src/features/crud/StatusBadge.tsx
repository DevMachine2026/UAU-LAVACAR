type StatusBadgeVariant = "success" | "danger" | "warning" | "overdue" | "inactive";

const styleMap: Record<StatusBadgeVariant, string> = {
  success: "border border-green-200 bg-green-50 text-green-700",
  danger: "border border-red-200 bg-red-50 text-red-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  overdue: "border border-orange-200 bg-orange-50 text-orange-700",
  inactive: "border border-gray-200 bg-gray-50 text-gray-500",
};

export function StatusBadge({
  active,
  label,
  variant,
}: {
  active?: boolean;
  label?: string;
  variant?: StatusBadgeVariant;
}) {
  const enabled = active !== false;
  const resolvedVariant = variant ?? (enabled ? "success" : "inactive");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styleMap[resolvedVariant]}`}
    >
      {label ?? (enabled ? "Ativo" : "Inativo")}
    </span>
  );
}
