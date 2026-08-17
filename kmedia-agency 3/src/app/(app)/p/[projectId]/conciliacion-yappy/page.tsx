import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmYappyPayment, rejectYappyPayment } from "./actions";

export const dynamic = "force-dynamic";

const rejectionReasons = [
  "Referencia no encontrada",
  "Monto incorrecto",
  "Pago duplicado",
  "Otro",
];

export default async function ConciliacionYappyPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const { data: movements } = await supabase
    .from("payment_movements")
    .select("id, student_id, amount, payment_date, reference, status, rejection_reason, students(first_name, last_name)")
    .eq("project_id", projectId)
    .eq("method", "yappy")
    .order("payment_date", { ascending: false });

  const pending = movements?.filter((m) => m.status === "pending_reconciliation") ?? [];
  const resolved = movements?.filter((m) => m.status !== "pending_reconciliation") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="mb-4">Pendientes de conciliación ({pending.length})</CardTitle>
        {pending.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No hay pagos Yappy pendientes.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((m) => {
              const student = m.students as unknown as { first_name: string; last_name: string } | null;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">
                      {student ? `${student.last_name}, ${student.first_name}` : "—"}
                    </div>
                    <div className="text-slate-500">
                      ${m.amount.toFixed(2)} · {m.payment_date} · Ref: {m.reference || "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={confirmYappyPayment.bind(null, projectId, m.id)}>
                      <Button type="submit" variant="primary" className="!bg-status-success hover:!bg-green-700">
                        Confirmar
                      </Button>
                    </form>
                    <form
                      action={rejectYappyPayment.bind(null, projectId, m.id)}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="rejection_reason"
                        required
                        className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Motivo de rechazo</option>
                        {rejectionReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="danger">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <CardTitle>Historial</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resolved.map((m) => {
              const student = m.students as unknown as { first_name: string; last_name: string } | null;
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    {student ? `${student.last_name}, ${student.first_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.payment_date}</td>
                  <td className="px-4 py-3">${m.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{m.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.status === "confirmed" ? "success" : "danger"}>
                      {m.status === "confirmed" ? "Conciliado" : "Rechazado"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.rejection_reason || "—"}</td>
                </tr>
              );
            })}
            {resolved.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Sin historial todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
