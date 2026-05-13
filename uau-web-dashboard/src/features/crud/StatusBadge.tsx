export function StatusBadge({ active, label }: { active?: boolean; label?: string }) {
  const enabled = active !== false;
  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-uau-gray"}`}>
      {label ?? (enabled ? "Ativo" : "Inativo")}
    </span>
  );
}
