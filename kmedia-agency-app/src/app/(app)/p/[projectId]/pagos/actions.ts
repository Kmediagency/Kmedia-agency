"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  calculateCollectedTotal,
  calculateMinimumFirstInstallment,
  calculateMinimumInstallment,
  calculateStudentTotal,
} from "@/lib/financial/calculations";

const paymentSchema = z.object({
  student_id: z.string().min(1, "Selecciona un estudiante"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  payment_date: z.string().min(1),
  method: z.enum(["cash"]),
  reference: z.string().optional(),
  observation: z.string().optional(),
});

/**
 * Registra un movimiento de pago. Valida las reglas de cuotas antes de
 * guardar: la primera cuota debe cubrir 1/3 del paquete + el 100% de los
 * extras; las cuotas siguientes deben ser al menos 1/3 del paquete (o
 * completar el saldo restante, lo que sea menor). Todos los pagos son en
 * efectivo y quedan confirmados de inmediato.
 */
export async function registerPayment(
  projectId: string,
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = paymentSchema.safeParse({
    student_id: formData.get("student_id"),
    amount: formData.get("amount"),
    payment_date: formData.get("payment_date"),
    method: formData.get("method") || "cash",
    reference: formData.get("reference") || undefined,
    observation: formData.get("observation") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { student_id, amount, payment_date, method, reference, observation } = parsed.data;

  const supabase = createClient();

  const [{ data: student }, { data: existingMovements }] = await Promise.all([
    supabase.from("students").select("package_id").eq("id", student_id).single(),
    supabase
      .from("payment_movements")
      .select("amount, status")
      .eq("student_id", student_id),
  ]);

  if (!student) return { error: "Estudiante no encontrado" };

  const { data: pkg } = student.package_id
    ? await supabase.from("packages").select("price").eq("id", student.package_id).single()
    : { data: null };

  const { data: studentExtras } = await supabase
    .from("student_extras")
    .select("quantity, extras(price)")
    .eq("student_id", student_id);

  const extrasForCalc = (studentExtras ?? []).map((se) => ({
    unitPrice: (se.extras as unknown as { price: number } | null)?.price ?? 0,
    quantity: se.quantity,
  }));

  const total = calculateStudentTotal(pkg?.price ?? null, extrasForCalc);
  const collectedSoFar = calculateCollectedTotal(existingMovements ?? []);
  const isFirstPayment = (existingMovements ?? []).length === 0;
  const balance = total - collectedSoFar;

  if (isFirstPayment && pkg?.price) {
    const minimum = calculateMinimumFirstInstallment(pkg.price, extrasForCalc);
    if (amount < minimum && amount < balance) {
      return {
        error: `La primera cuota debe ser al menos $${minimum.toFixed(2)} (incluye extras completos).`,
      };
    }
  } else if (!isFirstPayment && pkg?.price) {
    const minimum = calculateMinimumInstallment(pkg.price);
    if (amount < minimum && amount < balance) {
      return {
        error: `Cada cuota debe ser al menos $${minimum.toFixed(2)} (1/3 del paquete), salvo que complete el saldo.`,
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payment_movements").insert({
    project_id: projectId,
    student_id,
    amount,
    payment_date,
    method,
    reference: reference || null,
    status: "confirmed",
    observation: observation || null,
    reconciled_at: new Date().toISOString(),
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/p/${projectId}/pagos`);
  revalidatePath(`/p/${projectId}/estudiantes/${student_id}`);
  return { error: null };
}

/**
 * Revierte un pago creando un movimiento de correccion (monto negativo),
 * nunca borra ni edita el movimiento original.
 */
export async function reversePayment(projectId: string, movementId: string) {
  const supabase = createClient();

  const { data: original } = await supabase
    .from("payment_movements")
    .select("*")
    .eq("id", movementId)
    .single();

  if (!original) throw new Error("Movimiento no encontrado");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payment_movements").insert({
    project_id: projectId,
    student_id: original.student_id,
    amount: -original.amount,
    payment_date: new Date().toISOString().slice(0, 10),
    method: original.method,
    reference: original.reference,
    status: original.status === "confirmed" ? "confirmed" : "rejected",
    observation: "Correccion / reversa de pago",
    reversal_of_id: original.id,
    created_by: user?.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${projectId}/pagos`);
  revalidatePath(`/p/${projectId}/estudiantes/${original.student_id}`);
}

/**
 * Elimina permanentemente un movimiento de pago. Solo debe usarse para
 * corregir un error de captura (ej. estudiante equivocado). Para anular un
 * pago que si ocurrio, usar reversePayment en su lugar.
 */
export async function deletePaymentMovement(projectId: string, studentId: string, movementId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("payment_movements").delete().eq("id", movementId);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${projectId}/pagos`);
  revalidatePath(`/p/${projectId}/estudiantes/${studentId}`);
}
