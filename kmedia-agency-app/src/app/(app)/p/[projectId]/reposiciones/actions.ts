"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setReplacementDate(projectId: string, replacementId: string, formData: FormData) {
  const newDate = String(formData.get("new_date") ?? "");
  if (!newDate) throw new Error("Selecciona una fecha");

  const supabase = createClient();
  const { error } = await supabase
    .from("replacements")
    .update({ new_date: newDate })
    .eq("id", replacementId);

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/reposiciones`);
}

export async function completeReplacement(projectId: string, replacementId: string, studentId: string) {
  const supabase = createClient();

  const { error: replacementError } = await supabase
    .from("replacements")
    .update({ status: "completed" })
    .eq("id", replacementId);
  if (replacementError) throw new Error(replacementError.message);

  const { error: studentError } = await supabase
    .from("students")
    .update({ photo_status: "replacement_completed" })
    .eq("id", studentId);
  if (studentError) throw new Error(studentError.message);

  revalidatePath(`/p/${projectId}/reposiciones`);
  revalidatePath(`/p/${projectId}/estudiantes`);
  revalidatePath(`/p/${projectId}/jornadas`);
}
