"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const disbursementSchema = z.object({
  concept: z.enum(["club_padres", "ninth_grade_fund"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  disbursement_date: z.string().min(1),
  method: z.enum(["cash", "transfer", "yappy", "other"]),
  reference: z.string().optional(),
  observation: z.string().optional(),
});

export async function registerDisbursement(projectId: string, formData: FormData) {
  const parsed = disbursementSchema.safeParse({
    concept: formData.get("concept"),
    amount: formData.get("amount"),
    disbursement_date: formData.get("disbursement_date"),
    method: formData.get("method"),
    reference: formData.get("reference") || undefined,
    observation: formData.get("observation") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("school_disbursements").insert({
    project_id: projectId,
    ...parsed.data,
    reference: parsed.data.reference || null,
    observation: parsed.data.observation || null,
    created_by: user?.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/p/${projectId}/aportes-colegio`);
}
