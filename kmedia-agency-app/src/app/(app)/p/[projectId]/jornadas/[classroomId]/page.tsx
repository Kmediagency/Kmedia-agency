import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import {
  financialStatusLabel,
  financialStatusTone,
  gownSizes,
  participationStatusLabel,
  photoStatusLabel,
  photoStatusTone,
} from "@/lib/labels";
import {
  calculateBalance,
  calculateCollectedTotal,
  calculateFinancialStatus,
  calculateStudentTotal,
} from "@/lib/financial/calculations";
import {
  quickRegisterPayment,
  setStudentParticipationFromForm,
  setStudentPhotoStatus,
  updateStudentGownSizeFromForm,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function JornadaSalonPage({
  params,
}: {
  params: { projectId: string; classroomId: string };
}) {
  const supabase = createClient();
  const { projectId, classroomId } = params;

  const [{ data: classroom }, { data: project }] = await Promise.all([
    supabase.from("classrooms").select("id, name, photo_date, grade_id").eq("id", classroomId).single(),
    supabase.from("projects").select("final_due_date").eq("id", projectId).single(),
  ]);

  if (!classroom) notFound();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, gown_size, participation_status, photo_status, package_id, packages(price)"
    )
    .eq("classroom_id", classroomId)
    .order("last_name");

  const studentIds = (students ?? []).map((s) => s.id);
  const [{ data: allMovements }, { data: allStudentExtras }] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("payment_movements").select("student_id, amount, status").in("student_id", studentIds)
      : Promise.resolve({ data: [] as { student_id: string; amount: number; status: string }[] }),
    studentIds.length > 0
      ? supabase.from("student_extras").select("student_id, quantity, extras(price)").in("student_id", studentIds)
      : Promise.resolve({ data: [] as { student_id: string; quantity: number; extras: unknown }[] }),
  ]);

  const today = new Date();
  const finalDueDate = project?.final_due_date ? new Date(project.final_due_date) : null;

  const rows = (students ?? []).map((student) => {
    const packagePrice = (student.packages as unknown as { price: number } | null)?.price ?? null;
    const extras = (allStudentExtras ?? [])
      .filter((se) => se.student_id === student.id)
      .map((se) => ({
        unitPrice: (se.extras as unknown as { price: number } | null)?.price ?? 0,
        quantity: se.quantity,
      }));
    const movements = (allMovements ?? []).filter((m) => m.student_id === student.id);

    const total = calculateStudentTotal(packagePrice, extras);
    const collected = calculateCollectedTotal(
      movements as { amount: number; status: "pending_reconciliation" | "confirmed" | "rejected" }[]
    );
    const balance = calculateBalance(total, collected);
    const status = calculateFinancialStatus({
      participationStatus: student.participation_status,
      total,
      collected,
      today,
      finalDueDate,
    });

    return { student, total, collected, balance, status };
  });

  return (
    <div>
      <div className="mb-6">
        <Link href={`/p/${projectId}/jornadas`} className="text-sm text-slate-500 hover:text-slate-800">
          ← Jornadas
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Salón {classroom.name}
          {classroom.photo_date && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              · Jornada: {classroom.photo_date}
            </span>
          )}
        </h1>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">Estudiante</th>
              <th className="px-3 py-3">Participación</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3">Pagado</th>
              <th className="px-3 py-3">Saldo</th>
              <th className="px-3 py-3">Talla</th>
              <th className="px-3 py-3">Pago rápido</th>
              <th className="px-3 py-3">Estado fotográfico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ student, total, collected, balance, status }) => (
              <tr key={student.id} className="align-top hover:bg-slate-50">
                <td className="px-3 py-3">
                  <Link
                    href={`/p/${projectId}/estudiantes/${student.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {student.last_name}, {student.first_name}
                  </Link>
                  <div className="mt-1">
                    <Badge tone={financialStatusTone[status]}>{financialStatusLabel[status]}</Badge>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <AutoSubmitSelect
                    name="participation_status"
                    defaultValue={student.participation_status}
                    action={setStudentParticipationFromForm.bind(null, projectId, student.id)}
                  >
                    {Object.entries(participationStatusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </td>
                <td className="px-3 py-3 text-slate-600">${total.toFixed(2)}</td>
                <td className="px-3 py-3 text-slate-600">${collected.toFixed(2)}</td>
                <td className="px-3 py-3 font-medium text-slate-900">${balance.toFixed(2)}</td>
                <td className="px-3 py-3">
                  <AutoSubmitSelect
                    name="gown_size"
                    defaultValue={student.gown_size ?? ""}
                    action={updateStudentGownSizeFromForm.bind(null, projectId, student.id)}
                    className="w-20"
                  >
                    <option value="">—</option>
                    {gownSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </td>
                <td className="px-3 py-3">
                  <form
                    action={quickRegisterPayment.bind(null, projectId)}
                    className="flex items-center gap-1"
                  >
                    <input type="hidden" name="student_id" value={student.id} />
                    <input type="hidden" name="payment_date" value={new Date().toISOString().slice(0, 10)} />
                    <input type="hidden" name="method" value="cash" />
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      placeholder="$"
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Pagar
                    </button>
                  </form>
                </td>
                <td className="px-3 py-3">
                  <div className="mb-1">
                    <Badge tone={photoStatusTone[student.photo_status]}>
                      {photoStatusLabel[student.photo_status]}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <form action={setStudentPhotoStatus.bind(null, projectId, student.id, "photographed")}>
                      <button type="submit" className="text-brand-600 hover:underline">
                        Fotografiado
                      </button>
                    </form>
                    <form action={setStudentPhotoStatus.bind(null, projectId, student.id, "absent")}>
                      <button type="submit" className="text-status-danger hover:underline">
                        Ausente
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Este salón no tiene estudiantes todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
