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
    return (
      <EmptyState
        title="Nenhum registro"
        description="Cadastre o primeiro item para comecar."
      />
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <Card key={row.id}>
            <dl className="space-y-2">
              {columns.map((col) => (
                <div
                  className="flex items-start justify-between gap-2 text-sm"
                  key={col.header}
                >
                  <dt className="shrink-0 font-medium text-uau-gray">
                    {col.header}
                  </dt>
                  <dd className="text-right text-uau-black">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {(onEdit || onToggle) ? (
              <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                {onEdit ? (
                  <Button onClick={() => onEdit(row)} type="button" variant="ghost">
                    Editar
                  </Button>
                ) : null}
                {onToggle ? (
                  <Button onClick={() => onToggle(row)} type="button" variant="ghost">
                    {toggleLabel?.(row) ?? "Alternar"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden overflow-x-auto p-0 sm:block">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-uau-gray"
                  key={column.header}
                >
                  {column.header}
                </th>
              ))}
              {(onEdit || onToggle) ? (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-uau-gray">
                  Acoes
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                className={`border-b border-gray-100 transition-colors last:border-0 hover:bg-uau-primary/5 ${
                  index % 2 === 1 ? "bg-gray-50/40" : ""
                }`}
                key={row.id}
              >
                {columns.map((column) => (
                  <td
                    className="px-4 py-3 align-middle text-uau-black"
                    key={column.header}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {(onEdit || onToggle) ? (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {onEdit ? (
                        <Button
                          onClick={() => onEdit(row)}
                          type="button"
                          variant="ghost"
                        >
                          Editar
                        </Button>
                      ) : null}
                      {onToggle ? (
                        <Button
                          onClick={() => onToggle(row)}
                          type="button"
                          variant="ghost"
                        >
                          {toggleLabel?.(row) ?? "Alternar"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
