type StatusBadgeVariant = "success" | "danger" | "warning" | "inactive";

const colorMap: Record<StatusBadgeVariant, string> = {
  success: "bg-[#0BA95B]/10 text-[#0BA95B]",
  danger: "bg-[#D92D20]/10 text-[#D92D20]",
  warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
  inactive: "bg-gray-100 text-[#667085]",
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
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${colorMap[resolvedVariant]}`}>
      {label ?? (enabled ? "Ativo" : "Inativo")}
    </span>
  );
}
