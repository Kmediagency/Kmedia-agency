"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---------- Proyecto (datos generales y financieros) ----------

const projectSettingsSchema = z.object({
  name: z.string().min(1),
  school_name: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2100),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  installment_2_date: z.string().optional(),
  installment_3_date: z.string().optional(),
  final_due_date: z.string().optional(),
});

export async function updateProjectSettings(projectId: string, formData: FormData) {
  const parsed = projectSettingsSchema.safeParse({
    name: formData.get("name"),
    school_name: formData.get("school_name"),
    year: formData.get("year"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date") || undefined,
    installment_2_date: formData.get("installment_2_date") || undefined,
    installment_3_date: formData.get("installment_3_date") || undefined,
    final_due_date: formData.get("final_due_date") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      installment_2_date: parsed.data.installment_2_date || null,
      installment_3_date: parsed.data.installment_3_date || null,
      final_due_date: parsed.data.final_due_date || null,
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/configuracion`);
}

export async function setProjectStatus(
  projectId: string,
  status: "preparation" | "active" | "closed"
) {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/configuracion`);
}

// ---------- Grados ----------

export async function createGrade(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const isNinthGrade = formData.get("is_ninth_grade") === "on";
  if (!name) throw new Error("El nombre del grado es obligatorio");

  const supabase = createClient();
  const { error } = await supabase
    .from("grades")
    .insert({ project_id: projectId, name, is_ninth_grade: isNinthGrade });

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/configuracion`);
}

export async function deleteGrade(projectId: string, gradeId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("grades").delete().eq("id", gradeId);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: este grado tiene salones o estudiantes asociados."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath(`/p/${projectId}/configuracion`);
}

// ---------- Salones (usados tambien desde Jornadas) ----------

export async function createClassroom(projectId: string, formData: FormData) {
  const gradeId = String(formData.get("grade_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const photoDate = String(formData.get("photo_date") ?? "") || null;

  if (!gradeId || !name) throw new Error("Grado y nombre del salón son obligatorios");

  const supabase = createClient();
  const { error } = await supabase.from("classrooms").insert({
    project_id: projectId,
    grade_id: gradeId,
    name,
    photo_date: photoDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/configuracion`);
  revalidatePath(`/p/${projectId}/jornadas`);
}

export async function updateClassroomDate(
  projectId: string,
  classroomId: string,
  formData: FormData
) {
  const photoDate = String(formData.get("photo_date") ?? "") || null;
  const supabase = createClient();
  const { error } = await supabase
    .from("classrooms")
    .update({ photo_date: photoDate })
    .eq("id", classroomId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/configuracion`);
  revalidatePath(`/p/${projectId}/jornadas`);
}

export async function deleteClassroom(projectId: string, classroomId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: este salón tiene estudiantes asignados. Muévelos a otro salón primero."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath(`/p/${projectId}/configuracion`);
  revalidatePath(`/p/${projectId}/jornadas`);
}
