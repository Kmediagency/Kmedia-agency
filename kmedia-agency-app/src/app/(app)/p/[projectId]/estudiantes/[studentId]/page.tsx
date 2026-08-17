import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  financialStatusLabel,
  financialStatusTone,
  gownSizes,
  participationStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
  photoStatusLabel,
  photoStatusTone,
} from "@/lib/labels";
import {
  calculateBalance,
  calculateCollectedTotal,
  calculateExtrasTotal,
  calculateFinancialStatus,
  calculateStudentTotal,
} from "@/lib/financial/calculations";
import { updateStudent, updateStudentPurchase } from "./actions";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export const dynamic = "force-dynamic";

export default async function EstudianteDetallePage({
  params,
}: {
  params: { projectId: string; studentId: string };
}) {
  const supabase = createClient();
  const { projectId, studentId } = params;

  const [{ data: student }, { data: grades }, { data: classrooms }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase.from("grades").select("id, name").eq("project_id", projectId).order("sort_order"),
    supabase.from("classrooms").select("id, name").eq("project_id", projectId).order("name"),
  ]);

  if (!student) notFound();

  const [{ data: packages }, { data: packageGrades }, { data: extras }, { data: studentExtras }] =
    await Promise.all([
      supabase
        .from("packages")
        .select("id, name, price, active")
        .eq("project_id", projectId)
        .order("name"),
      supabase.from("package_grades").select("package_id, grade_id"),
      supabase
        .from("extras")
        .select("id, name, price, active")
        .eq("project_id", projectId)
        .order("name"),
      supabase
        .from("student_extras")
        .select("extra_id, quantity")
        .eq("student_id", studentId),
    ]);

  // Paquetes disponibles para el grado del estudiante: si un paquete no tiene
  // grados asociados en package_grades, está disponible para todos.
  const restrictedPackageIds = new Set(packageGrades?.map((pg) => pg.package_id));
  const availablePackages = (packages ?? []).filter((pkg) => {
    if (!pkg.active && pkg.id !== student.package_id) return false;
    if (!restrictedPackageIds.has(pkg.id)) return true;
    return packageGrades?.some((pg) => pg.package_id === pkg.id && pg.grade_id === student.grade_id);
  });

  const selectedPackage = packages?.find((p) => p.id === student.package_id) ?? null;
  const extrasSelection = (extras ?? [])
    .filter((e) => e.active || (studentExtras ?? []).some((se) => se.extra_id === e.id))
    .map((extra) => ({
      ...extra,
      quantity: studentExtras?.find((se) => se.extra_id === extra.id)?.quantity ?? 0,
    }));

  const extrasForTotal = extrasSelection
    .filter((e) => e.quantity > 0)
    .map((e) => ({ unitPrice: e.price, quantity: e.quantity }));
  const extrasTotal = calculateExtrasTotal(extrasForTotal);
  const studentTotal = calculateStudentTotal(selectedPackage?.price ?? null, extrasForTotal);

  const [{ data: project }, { data: movements }] = await Promise.all([
    supabase.from("projects").select("final_due_date").eq("id", projectId).single(),
    supabase
      .from("payment_movements")
      .select("id, amount, payment_date, method, reference, status")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false }),
  ]);

  const collected = calculateCollectedTotal(movements ?? []);
  const balance = calculateBalance(studentTotal, collected);
  const financialStatus = calculateFinancialStatus({
    participationStatus: student.participation_status,
    total: studentTotal,
    collected,
    today: new Date(),
    finalDueDate: project?.final_due_date ? new Date(project.final_due_date) : null,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {student.last_name}, {student.first_name}
        </h1>
        <Badge tone={photoStatusTone[student.photo_status]}>
          {photoStatusLabel[student.photo_status]}
        </Badge>
      </div>

      {student.phone && (
        <WhatsAppContact
          phone={student.phone}
          variables={{
            nombre: student.first_name,
            apellido: student.last_name,
            saldo: balance.toFixed(2),
            total: studentTotal.toFixed(2),
            paquete: selectedPackage?.name ?? "",
            fecha: student.photo_date ?? "",
            salon: classrooms?.find((c) => c.id === student.classroom_id)?.name ?? "",
          }}
        />
      )}

      {/* Paquete y extras */}
      <Card>
        <CardTitle className="mb-4">Paquete y extras</CardTitle>
        <form action={updateStudentPurchase.bind(null, projectId, studentId)} className="space-y-4">
          <Select
            name="package_id"
            label="Paquete principal"
            defaultValue={student.package_id ?? ""}
          >
            <option value="">Sin paquete</option>
            {availablePackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} — ${pkg.price.toFixed(2)}
                {!pkg.active ? " (inactivo)" : ""}
              </option>
            ))}
          </Select>

          {extrasSelection.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Extras</p>
              <div className="space-y-2">
                {extrasSelection.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">
                      {extra.name} (${extra.price.toFixed(2)} c/u)
                      {!extra.active && <span className="text-slate-400"> — inactivo</span>}
                    </span>
                    <input
                      type="number"
                      min="0"
                      name={`extra_qty_${extra.id}`}
                      defaultValue={extra.quantity}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Paquete base</span>
              <span>${(selectedPackage?.price ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total extras</span>
              <span>${extrasTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-medium text-slate-900">
              <span>Total compra</span>
              <span>${studentTotal.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-slate-500">
              <span>Total pagado</span>
              <span>${collected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-900">
              <span>Saldo pendiente</span>
              <span>${balance.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <Badge tone={financialStatusTone[financialStatus]}>
                {financialStatusLabel[financialStatus]}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary">
              Guardar paquete y extras
            </Button>
          </div>
        </form>
      </Card>

      {/* Historial de pagos */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Historial de pagos</CardTitle>
          <Link href={`/p/${projectId}/pagos`} className="text-sm text-brand-600 hover:underline">
            Registrar pago →
          </Link>
        </div>
        {movements && movements.length > 0 ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <div>
                  <span className={m.amount < 0 ? "text-status-danger" : "text-slate-900"}>
                    ${m.amount.toFixed(2)}
                  </span>
                  <span className="ml-2 text-slate-500">
                    {paymentMethodLabel[m.method]} · {m.payment_date}
                    {m.reference && ` · Ref: ${m.reference}`}
                  </span>
                </div>
                <Badge tone={paymentStatusTone[m.status]}>{paymentStatusLabel[m.status]}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-sm text-slate-400">Sin pagos registrados todavía.</p>
        )}
      </Card>

      {/* Datos del estudiante */}
      <Card>
        <CardTitle className="mb-4">Datos del estudiante</CardTitle>
        <form
          action={updateStudent.bind(null, projectId, studentId)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" name="first_name" defaultValue={student.first_name} required />
            <Input label="Apellido" name="last_name" defaultValue={student.last_name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select name="grade_id" label="Grado" defaultValue={student.grade_id} required>
              {grades?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Select name="classroom_id" label="Salón" defaultValue={student.classroom_id} required>
              {classrooms?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Bachiller / especialidad" name="track" defaultValue={student.track ?? ""} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" defaultValue={student.phone ?? ""} />
            <Input label="Correo" name="email" type="email" defaultValue={student.email ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select name="gown_size" label="Talla de toga" defaultValue={student.gown_size ?? ""}>
              <option value="">Sin definir</option>
              {gownSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
            <Select
              name="participation_status"
              label="Participación"
              defaultValue={student.participation_status}
            >
              {Object.entries(participationStatusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Select name="photo_status" label="Estado fotográfico" defaultValue={student.photo_status}>
            {Object.entries(photoStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Observaciones internas</span>
            <textarea
              name="internal_notes"
              defaultValue={student.internal_notes ?? ""}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <div className="flex justify-end pt-2">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
