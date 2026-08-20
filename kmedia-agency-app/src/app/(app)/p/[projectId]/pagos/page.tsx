import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { getStudentFinancialSummaries } from "@/lib/financial/student-summary";
import { reversePayment, deletePaymentMovement } from "./actions";
import { PaymentForm } from "./payment-form";

export const dynamic = "force-dynamic";

export default async function PagosPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [summaries, { data: movements }] = await Promise.all([
    getStudentFinancialSummaries(supabase, projectId),
    supabase
      .from("payment_movements")
      .select("id, student_id, amount, payment_date, method, reference, status, observation, reversal_of_id")
      .eq("project_id", projectId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const summaryById = new Map(summaries.map((s) => [s.studentId, s]));
  const purchasers = summaries.filter((s) => s.participationStatus === "purchased");

  return (
    <div className="space-y-6">
      {/* Registrar pago */}
      <Card>
        <CardTitle className="mb-4">Registrar pago</CardTitle>
        <PaymentForm projectId={projectId} purchasers={purchasers} />
      </Card>

      {/* Movimientos recientes */}
      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <CardTitle>Movimientos recientes</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements?.map((m) => {
              const student = summaryById.get(m.student_id);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{m.payment_date}</td>
                  <td className="px-4 py-3">
                    {student ? `${student.lastName}, ${student.firstName}` : "—"}
                  </td>
                  <td className={`px-4 py-3 ${m.amount < 0 ? "text-status-danger" : ""}`}>
                    ${m.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={paymentStatusTone[m.status]}>{paymentStatusLabel[m.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      {!m.reversal_of_id && m.amount > 0 && (
                        <form action={reversePayment.bind(null, projectId, m.id)}>
                          <button type="submit" className="text-xs text-status-warning hover:underline">
                            Revertir
                          </button>
                        </form>
                      )}
                      <form action={deletePaymentMovement.bind(null, projectId, m.student_id, m.id)}>
                        <button type="submit" className="text-xs text-status-danger hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!movements || movements.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aun no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
