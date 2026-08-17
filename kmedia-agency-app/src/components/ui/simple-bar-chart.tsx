interface BarRow {
  label: string;
  value: number;
  color: string;
}

/**
 * Gráfica de barras horizontales simple, sin librerías externas. Suficiente
 * para los indicadores del dashboard sin agregar peso ni complejidad.
 */
export function SimpleBarChart({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>{row.label}</span>
            <span className="font-medium text-slate-900">{row.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
