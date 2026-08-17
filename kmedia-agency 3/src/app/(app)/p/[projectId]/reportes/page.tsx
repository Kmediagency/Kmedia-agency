import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReportesPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  const base = `/api/reportes/${projectId}`;
  const today = new Date().toISOString().slice(0, 10);

  const reports = [
    { type: "general", label: "Reporte general del proyecto" },
    { type: "estudiantes", label: "Estudiantes" },
    { type: "pagos", label: "Pagos" },
    { type: "morosos", label: "Morosos" },
    { type: "reposiciones", label: "Reposiciones" },
    { type: "aportes-colegio", label: "Aportes al colegio" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="mb-4">Reporte diario</CardTitle>
        <form action={base} method="get" className="flex items-end gap-3">
          <input type="hidden" name="type" value="diario" />
          <Input name="date" label="Fecha" type="date" defaultValue={today} />
          <Button type="submit">Descargar Excel</Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-4">Otros reportes</CardTitle>
        <ul className="divide-y divide-slate-100">
          {reports.map((report) => (
            <li key={report.type} className="flex items-center justify-between py-3 text-sm">
              <span className="text-slate-700">{report.label}</span>
              <a href={`${base}?type=${report.type}`}>
                <Button type="button" variant="secondary">
                  Descargar Excel
                </Button>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
