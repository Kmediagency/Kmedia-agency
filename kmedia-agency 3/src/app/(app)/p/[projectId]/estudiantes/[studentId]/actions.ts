"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  grade_id: z.string().min(1),
  classroom_id: z.string().min(1),
  track: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  gown_size: z.string().optional(),
  participation_status: z.enum(["undefined", "purchased", "not_participating", "scholarship"]),
  photo_status: z.enum([
    "pending",
    "photographed",
    "absent",
    "replacement_pending",
    "replacement_completed",
  ]),
  internal_notes: z.string().optional(),
});

export async function updateStudent(
  projectId: string,
  studentId: string,
  formData: FormData
) {
  const parsed = updateSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    grade_id: formData.get("grade_id"),
    classroom_id: formData.get("classroom_id"),
    track: formData.get("track") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    gown_size: formData.get("gown_size") || undefined,
    participation_status: formData.get("participation_status"),
    photo_status: formData.get("photo_status"),
    internal_notes: formData.get("internal_notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ ...parsed.data, gown_size: (parsed.data.gown_size || null) as never })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/estudiantes/${studentId}`);
  revalidatePath(`/p/${projectId}/estudiantes`);
}

/**
 * Asigna (o cambia) el paquete principal del estudiante y actualiza sus
 * extras con cantidad. Nunca borra payment_movements: el total y el saldo
 * se recalculan automáticamente a partir de los precios vigentes.
 */
export async function updateStudentPurchase(
  projectId: string,
  studentId: string,
  formData: FormData
) {
  const packageId = String(formData.get("package_id") ?? "") || null;
  const supabase = createClient();

  const { error: packageError } = await supabase
    .from("students")
    .update({ package_id: packageId })
    .eq("id", studentId);
  if (packageError) throw new Error(packageError.message);

  // Reconstruir student_extras a partir de las cantidades enviadas (0 = quitar)
  const { data: allExtras } = await supabase.from("extras").select("id").eq("project_id", projectId);

  const rows = (allExtras ?? [])
    .map((extra) => ({
      extra_id: extra.id,
      quantity: Number(formData.get(`extra_qty_${extra.id}`) ?? 0),
    }))
    .filter((row) => row.quantity > 0);

  const { error: deleteError } = await supabase
    .from("student_extras")
    .delete()
    .eq("student_id", studentId);
  if (deleteError) throw new Error(deleteError.message);

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("student_extras").insert(
      rows.map((row) => ({
        student_id: studentId,
        extra_id: row.extra_id,
        quantity: row.quantity,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/p/${projectId}/estudiantes/${studentId}`);
  revalidatePath(`/p/${projectId}/estudiantes`);
}

