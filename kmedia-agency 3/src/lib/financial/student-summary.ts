import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  calculateBalance,
  calculateCollectedTotal,
  calculateFinancialStatus,
  calculateStudentTotal,
  type FinancialStatus,
} from "./calculations";

export interface StudentFinancialSummary {
  studentId: string;
  firstName: string;
  lastName: string;
  classroomId: string;
  participationStatus: Database["public"]["Tables"]["students"]["Row"]["participation_status"];
  total: number;
  collected: number;
  balance: number;
  status: FinancialStatus;
}

/**
 * Trae y calcula el resumen financiero (total, cobrado, saldo, estado) de
 * todos los estudiantes de un proyecto. Única función que debe usarse para
 * esto — nunca recalcular estos valores directamente en un componente.
 */
export async function getStudentFinancialSummaries(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<StudentFinancialSummary[]> {
  const [{ data: project }, { data: students }, { data: allMovements }, { data: allStudentExtras }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("final_due_date")
        .eq("id", projectId)
        .single(),
      supabase
        .from("students")
        .select(
          "id, first_name, last_name, classroom_id, participation_status, package_id, packages(price)"
        )
        .eq("project_id", projectId),
      supabase
        .from("payment_movements")
        .select("student_id, amount, status")
        .eq("project_id", projectId),
      supabase
        .from("student_extras")
        .select("student_id, quantity, extras(price)"),
    ]);

  const today = new Date();
  const finalDueDate = project?.final_due_date ? new Date(project.final_due_date) : null;

  return (students ?? []).map((student) => {
    const packagePrice =
      (student.packages as unknown as { price: number } | null)?.price ?? null;

    const extras = (allStudentExtras ?? [])
      .filter((se) => se.student_id === student.id)
      .map((se) => ({
        unitPrice: (se.extras as unknown as { price: number } | null)?.price ?? 0,
        quantity: se.quantity,
      }));

    const movements = (allMovements ?? []).filter((m) => m.student_id === student.id);

    const total = calculateStudentTotal(packagePrice, extras);
    const collected = calculateCollectedTotal(movements);
    const balance = calculateBalance(total, collected);
    const status = calculateFinancialStatus({
      participationStatus: student.participation_status,
      total,
      collected,
      today,
      finalDueDate,
    });

    return {
      studentId: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      classroomId: student.classroom_id,
      participationStatus: student.participation_status,
      total,
      collected,
      balance,
      status,
    };
  });
}
