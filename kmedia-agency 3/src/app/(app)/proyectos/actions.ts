"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  school_name: z.string().min(1, "El colegio es obligatorio"),
  year: z.coerce.number().int().min(2020).max(2100),
  start_date: z.string().min(1, "La fecha de inicio es obligatoria"),
  yappy_number: z.string().optional(),
});

export async function createProject(formData: FormData) {
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    school_name: formData.get("school_name"),
    year: formData.get("year"),
    start_date: formData.get("start_date"),
    yappy_number: formData.get("yappy_number") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, created_by: user?.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/proyectos");
  redirect(`/p/${data.id}/configuracion`);
}

export async function updateProjectStatus(projectId: string, status: "active" | "closed" | "preparation") {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}
