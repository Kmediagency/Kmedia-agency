"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { registerPayment } from "../pagos/actions";

export async function quickRegisterPayment(projectId: string, formData: FormData): Promise<void> {
  await registerPayment(projectId, { error: null }, formData);
}

export async function setStudentPhotoStatus(
  projectId: string,
  studentId: string,
  photoStatus: "pending" | "photographed" | "absent" | "replacement_completed"
) {
  const supabase = createClient();

  const { data: student } = await supabase
    .from("students")
    .select("photo_date, classroom_id")
    .eq("id", studentId)
    .single();

  const { error } = await supabase
    .from("students")
    .update({ photo_status: photoStatus === "absent" ? "replacement_pending" : photoStatus })
    .eq("id", studentId);

  if (error) throw new Error(error.message);

  // Al marcar Ausente se crea automáticamente la reposición pendiente
  if (photoStatus === "absent") {
    const { data: existingReplacement } = await supabase
      .from("replacements")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .maybeSingle();

    if (!existingReplacement) {
      const { error: replacementError } = await supabase.from("replacements").insert({
        project_id: projectId,
        student_id: studentId,
        original_date: student?.photo_date ?? new Date().toISOString().slice(0, 10),
        status: "pending",
      });
      if (replacementError) throw new Error(replacementError.message);
    }
  }

  revalidatePath(`/p/${projectId}/jornadas`);
  revalidatePath(`/p/${projectId}/estudiantes`);
  revalidatePath(`/p/${projectId}/reposiciones`);
}

export async function updateStudentGownSize(projectId: string, studentId: string, gownSize: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ gown_size: (gownSize || null) as never })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/jornadas`);
}

export async function setStudentParticipation(
  projectId: string,
  studentId: string,
  participationStatus: "undefined" | "purchased" | "not_participating" | "scholarship"
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ participation_status: participationStatus })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/jornadas`);
  revalidatePath(`/p/${projectId}/estudiantes`);
}

/** Wrappers usados por AutoSubmitSelect: leen el valor desde el FormData. */
export async function updateStudentGownSizeFromForm(
  projectId: string,
  studentId: string,
  formData: FormData
) {
  await updateStudentGownSize(projectId, studentId, String(formData.get("gown_size") ?? ""));
}

export async function setStudentParticipationFromForm(
  projectId: string,
  studentId: string,
  formData: FormData
) {
  const value = String(formData.get("participation_status") ?? "undefined") as
    | "undefined"
    | "purchased"
    | "not_participating"
    | "scholarship";
  await setStudentParticipation(projectId, studentId, value);
}
