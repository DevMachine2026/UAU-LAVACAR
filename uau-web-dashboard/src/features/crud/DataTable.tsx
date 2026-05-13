import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/State";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onEdit,
  onToggle,
  toggleLabel,
}: {
  rows: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onToggle?: (row: T) => void;
  toggleLabel?: (row: T) => string;
}) {
  if (!rows.length) {
    return <EmptyState title="Nenhum registro" description="Cadastre o primeiro item para comecar." />;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th className="px-4 py-3 font-bold text-uau-gray" key={column.header}>{column.header}</th>
            ))}
            {(onEdit || onToggle) ? <th className="px-4 py-3 text-right font-bold text-uau-gray">Acoes</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-gray-100 last:border-0" key={row.id}>
              {columns.map((column) => (
                <td className="px-4 py-3 align-middle text-uau-black" key={column.header}>{column.cell(row)}</td>
              ))}
              {(onEdit || onToggle) ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {onEdit ? <Button onClick={() => onEdit(row)} type="button" variant="ghost">Editar</Button> : null}
                    {onToggle ? <Button onClick={() => onToggle(row)} type="button" variant="ghost">{toggleLabel?.(row) ?? "Alternar"}</Button> : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
