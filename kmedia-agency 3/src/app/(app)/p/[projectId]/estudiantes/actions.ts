"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const studentSchema = z.object({
  first_name: z.string().min(1, "El nombre es obligatorio"),
  last_name: z.string().min(1, "El apellido es obligatorio"),
  grade_id: z.string().min(1, "El grado es obligatorio"),
  classroom_id: z.string().min(1, "El salón es obligatorio"),
  track: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  gown_size: z.string().optional(),
});

export async function createStudent(projectId: string, formData: FormData) {
  const parsed = studentSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    grade_id: formData.get("grade_id"),
    classroom_id: formData.get("classroom_id"),
    track: formData.get("track") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    gown_size: formData.get("gown_size") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Heredar la fecha de fotografía del salón, si tiene una asignada
  const supabase = createClient();
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("photo_date")
    .eq("id", parsed.data.classroom_id)
    .single();

  const { error } = await supabase.from("students").insert({
    project_id: projectId,
    ...parsed.data,
    gown_size: (parsed.data.gown_size || null) as never,
    photo_date: classroom?.photo_date ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${projectId}/estudiantes`);
  redirect(`/p/${projectId}/estudiantes`);
}
