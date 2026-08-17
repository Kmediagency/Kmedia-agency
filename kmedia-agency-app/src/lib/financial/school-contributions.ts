import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  calculateClubPadresContribution,
  calculateCollectedTotal,
  calculateNinthGradeContribution,
  calculateStudentTotal,
} from "./calculations";

export interface SchoolContributionsGenerated {
  clubPadresGenerated: number;
  ninthGradeFundGenerated: number;
}

/**
 * Calcula lo GENERADO del Club de Padres y del Fondo de graduación de
 * noveno, siempre a partir de payment_movements — nunca un valor guardado.
 * Ver docs/business-rules.md.
 */
export async function calculateSchoolContributionsGenerated(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<SchoolContributionsGenerated> {
  const [{ data: project }, { data: students }, { data: allMovements }, { data: allStudentExtras }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("club_padres_rate, ninth_grade_contribution")
        .eq("id", projectId)
        .single(),
      supabase
        .from("students")
        .select("id, participation_status, package_id, grades(is_ninth_grade), packages(price)")
        .eq("project_id", projectId),
      supabase.from("payment_movements").select("student_id, amount, status").eq("project_id", projectId),
      supabase.from("student_extras").select("student_id, quantity, extras(price)"),
    ]);

  const rate = project?.club_padres_rate ?? 0.1;
  const ninthContributionAmount = project?.ninth_grade_contribution ?? 1;

  let clubPadresGenerated = 0;
  let ninthGradeFundGenerated = 0;

  for (const student of students ?? []) {
    const packagePrice = (student.packages as unknown as { price: number } | null)?.price ?? null;
    const isNinthGrade =
      (student.grades as unknown as { is_ninth_grade: boolean } | null)?.is_ninth_grade ?? false;

    const extras = (allStudentExtras ?? [])
      .filter((se) => se.student_id === student.id)
      .map((se) => ({
        unitPrice: (se.extras as unknown as { price: number } | null)?.price ?? 0,
        quantity: se.quantity,
      }));

    const movements = (allMovements ?? []).filter((m) => m.student_id === student.id);
    const total = calculateStudentTotal(packagePrice, extras);
    const collected = calculateCollectedTotal(movements);

    clubPadresGenerated += calculateClubPadresContribution({
      participationStatus: student.participation_status,
      collected,
      rate,
    });

    ninthGradeFundGenerated += calculateNinthGradeContribution({
      participationStatus: student.participation_status,
      isNinthGrade,
      hasPackage: !!student.package_id,
      total,
      collected,
      contributionAmount: ninthContributionAmount,
    });
  }

  return {
    clubPadresGenerated: Math.round(clubPadresGenerated * 100) / 100,
    ninthGradeFundGenerated: Math.round(ninthGradeFundGenerated * 100) / 100,
  };
}
