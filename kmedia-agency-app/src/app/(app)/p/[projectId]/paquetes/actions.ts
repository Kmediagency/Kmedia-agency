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
