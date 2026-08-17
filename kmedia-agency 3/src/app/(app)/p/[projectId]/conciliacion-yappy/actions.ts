"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function confirmYappyPayment(projectId: string, movementId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_movements")
    .update({ status: "confirmed", reconciled_at: new Date().toISOString() })
    .eq("id", movementId);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${projectId}/conciliacion-yappy`);
  revalidatePath(`/p/${projectId}/pagos`);
}

export async function rejectYappyPayment(projectId: string, movementId: string, formData: FormData) {
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (!reason) throw new Error("La observación de rechazo es obligatoria");

  const supabase = createClient();
  const { error } = await supabase
    .from("payment_movements")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", movementId);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${projectId}/conciliacion-yappy`);
  revalidatePath(`/p/${projectId}/pagos`);
}
