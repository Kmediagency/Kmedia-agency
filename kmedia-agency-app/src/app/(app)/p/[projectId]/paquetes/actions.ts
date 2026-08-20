"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---------- Paquetes ----------

const packageSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  description: z.string().optional(),
});

export async function createPackage(projectId: string, formData: FormData) {
  const parsed = packageSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));

  const gradeIds = formData.getAll("grade_ids").map(String);

  const supabase = createClient();
  const { data: pkg, error } = await supabase
    .from("packages")
    .insert({ project_id: projectId, ...parsed.data })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (gradeIds.length > 0) {
    const { error: linkError } = await supabase
      .from("package_grades")
      .insert(gradeIds.map((grade_id) => ({ package_id: pkg.id, grade_id })));
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath(`/p/${projectId}/paquetes`);
}

export async function updatePackage(projectId: string, packageId: string, formData: FormData) {
  const parsed = packageSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));

  const gradeIds = formData.getAll("grade_ids").map(String);

  const supabase = createClient();
  const { error } = await supabase.from("packages").update(parsed.data).eq("id", packageId);
  if (error) throw new Error(error.message);

  // Reemplazar las relaciones de grados disponibles
  const { error: deleteError } = await supabase
    .from("package_grades")
    .delete()
    .eq("package_id", packageId);
  if (deleteError) throw new Error(deleteError.message);

  if (gradeIds.length > 0) {
    const { error: linkError } = await supabase
      .from("package_grades")
      .insert(gradeIds.map((grade_id) => ({ package_id: packageId, grade_id })));
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath(`/p/${projectId}/paquetes`);
}

export async function togglePackageActive(projectId: string, packageId: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("packages").update({ active }).eq("id", packageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/paquetes`);
}

/**
 * Elimina un paquete. Si hay estudiantes con este paquete asignado, la base
 * de datos rechaza el borrado (integridad referencial) y mostramos un
 * mensaje claro en vez de perder datos de estudiantes silenciosamente.
 */
export async function deletePackage(projectId: string, packageId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("packages").delete().eq("id", packageId);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: hay estudiantes con este paquete asignado. Desactivalo en su lugar."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath(`/p/${projectId}/paquetes`);
}

// ---------- Extras ----------

const extraSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export async function createExtra(projectId: string, formData: FormData) {
  const parsed = extraSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));

  const supabase = createClient();
  const { error } = await supabase.from("extras").insert({ project_id: projectId, ...parsed.data });
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/paquetes`);
}

export async function toggleExtraActive(projectId: string, extraId: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("extras").update({ active }).eq("id", extraId);
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/paquetes`);
}

/**
 * Elimina un extra. Si algun estudiante ya lo tiene seleccionado, la base
 * de datos rechaza el borrado y mostramos un mensaje claro.
 */
export async function deleteExtra(projectId: string, extraId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("extras").delete().eq("id", extraId);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: hay estudiantes con este extra seleccionado. Desactivalo en su lugar."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath(`/p/${projectId}/paquetes`);
}
