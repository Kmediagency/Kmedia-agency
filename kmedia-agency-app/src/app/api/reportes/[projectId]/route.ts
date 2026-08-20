import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { getStudentFinancialSummaries } from "@/lib/financial/student-summary";
import { calculateSchoolContributionsGenerated } from "@/lib/financial/school-contributions";
import { isMovementCollected } from "@/lib/financial/calculations";
import {
  financialStatusLabel,
  participationStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  photoStatusLabel,
} from "@/lib/labels";

function toExcelResponse(workbook: XLSX.WorkBook, filename: string) {
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Sin datos": "" }]);
  XLSX.utils.book_append_sheet(wb, sheet, name.slice(0, 31));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const supabase = createClient();
  const projectId = params.projectId;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();
  const projectSlug = (project?.name ?? "proyecto").replace(/[^a-z0-9]+/gi, "_").toLowerCase();

  const [{ data: students }, { data: grades }, { data: classrooms }] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, first_name, last_name, phone, email, track, gown_size, participation_status, photo_status, photo_date, grade_id, classroom_id, package_id, packages(name)"
      )
      .eq("project_id", projectId),
    supabase.from("grades").select("id, name").eq("project_id", projectId),
    supabase.from("classrooms").select("id, name, grade_id, photo_date").eq("project_id", projectId),
  ]);

  const gradeName = (id: string) => grades?.find((g) => g.id === id)?.name ?? "";
  const classroomName = (id: string) => classrooms?.find((c) => c.id === id)?.name ?? "";

  const wb = XLSX.utils.book_new();

  switch (type) {
    case "estudiantes": {
      addSheet(
        wb,
        "Estudiantes",
        (students ?? []).map((s) => ({
          Nombre: s.first_name,
          Apellido: s.last_name,
          Grado: gradeName(s.grade_id),
          Salón: classroomName(s.classroom_id),
          Bachiller: s.track ?? "",
          Teléfono: s.phone ?? "",
          Correo: s.email ?? "",
          Talla: s.gown_size ?? "",
          Paquete: (s.packages as unknown as { name: string } | null)?.name ?? "",
          Participación: participationStatusLabel[s.participation_status],
          "Estado fotográfico": photoStatusLabel[s.photo_status],
        }))
      );
      return toExcelResponse(wb, `estudiantes_${projectSlug}.xlsx`);
    }

    case "pagos": {
      const { data: movements } = await supabase
        .from("payment_movements")
        .select("payment_date, amount, method, reference, status, observation, students(first_name, last_name)")
        .eq("project_id", projectId)
        .order("payment_date", { ascending: false });

      addSheet(
        wb,
        "Pagos",
        (movements ?? []).map((m) => {
          const student = m.students as unknown as { first_name: string; last_name: string } | null;
          return {
            Fecha: m.payment_date,
            Estudiante: student ? `${student.last_name}, ${student.first_name}` : "",
            Monto: m.amount,
            Método: paymentMethodLabel[m.method],
            Referencia: m.reference ?? "",
            Estado: paymentStatusLabel[m.status],
            Observación: m.observation ?? "",
          };
        })
      );
      return toExcelResponse(wb, `pagos_${projectSlug}.xlsx`);
    }

    case "morosos": {
      const summaries = await getStudentFinancialSummaries(supabase, projectId);
      const delinquent = summaries.filter((s) => s.status === "delinquent");
      addSheet(
        wb,
        "Morosos",
        delinquent.map((s) => ({
          Estudiante: `${s.lastName}, ${s.firstName}`,
          Total: s.total,
          Pagado: s.collected,
          Saldo: s.balance,
        }))
      );
      return toExcelResponse(wb, `morosos_${projectSlug}.xlsx`);
    }

    case "reposiciones": {
      const { data: replacements } = await supabase
        .from("replacements")
        .select("original_date, new_date, status, observation, students(first_name, last_name, grade_id, classroom_id)")
        .eq("project_id", projectId);

      addSheet(
        wb,
        "Reposiciones",
        (replacements ?? []).map((r) => {
          const student = r.students as unknown as {
            first_name: string;
            last_name: string;
            grade_id: string;
            classroom_id: string;
          } | null;
          return {
            Estudiante: student ? `${student.last_name}, ${student.first_name}` : "",
            Grado: student ? gradeName(student.grade_id) : "",
            Salón: student ? classroomName(student.classroom_id) : "",
            "Fecha original": r.original_date,
            "Nueva fecha": r.new_date ?? "",
            Estado: r.status === "completed" ? "Completada" : "Pendiente",
            Observación: r.observation ?? "",
          };
        })
      );
      return toExcelResponse(wb, `reposiciones_${projectSlug}.xlsx`);
    }

    case "aportes-colegio": {
      const [{ clubPadresGenerated, ninthGradeFundGenerated }, { data: disbursements }] =
        await Promise.all([
          calculateSchoolContributionsGenerated(supabase, projectId),
          supabase
            .from("school_disbursements")
            .select("disbursement_date, concept, amount, method, reference, observation")
            .eq("project_id", projectId),
        ]);

      addSheet(wb, "Resumen", [
        { Concepto: "Club de Padres generado", Monto: clubPadresGenerated },
        { Concepto: "Fondo de graduación 9.º generado", Monto: ninthGradeFundGenerated },
      ]);
      addSheet(
        wb,
        "Entregas",
        (disbursements ?? []).map((d) => ({
          Fecha: d.disbursement_date,
          Concepto: d.concept === "club_padres" ? "Club de Padres" : "Fondo de graduación 9.º",
          Monto: d.amount,
          Método: d.method,
          Referencia: d.reference ?? "",
          Observación: d.observation ?? "",
        }))
      );
      return toExcelResponse(wb, `aportes_colegio_${projectSlug}.xlsx`);
    }

    case "general": {
      const summaries = await getStudentFinancialSummaries(supabase, projectId);
      const purchasers = summaries.filter((s) => s.participationStatus === "purchased");

      addSheet(wb, "Resumen general", [
        { Indicador: "Total de estudiantes", Valor: students?.length ?? 0 },
        {
          Indicador: "Compraron paquete",
          Valor: summaries.filter((s) => s.participationStatus === "purchased").length,
        },
        {
          Indicador: "Becados",
          Valor: summaries.filter((s) => s.participationStatus === "scholarship").length,
        },
        { Indicador: "Total vendido", Valor: purchasers.reduce((sum, s) => sum + s.total, 0) },
        { Indicador: "Total cobrado", Valor: purchasers.reduce((sum, s) => sum + s.collected, 0) },
        {
          Indicador: "Total por cobrar",
          Valor: purchasers.reduce((sum, s) => sum + Math.max(0, s.balance), 0),
        },
        { Indicador: "Morosos", Valor: purchasers.filter((s) => s.status === "delinquent").length },
      ]);
      addSheet(
        wb,
        "Estudiantes",
        summaries.map((s) => ({
          Estudiante: `${s.lastName}, ${s.firstName}`,
          Participación: participationStatusLabel[s.participationStatus],
          Total: s.total,
          Pagado: s.collected,
          Saldo: s.balance,
          Estado: financialStatusLabel[s.status],
        }))
      );
      return toExcelResponse(wb, `reporte_general_${projectSlug}.xlsx`);
    }

    case "diario":
    default: {
      const dayClassrooms = (classrooms ?? []).filter((c) => c.photo_date === date);
      const dayStudents = (students ?? []).filter((s) =>
        dayClassrooms.some((c) => c.id === s.classroom_id)
      );
      const { data: dayMovements } = await supabase
        .from("payment_movements")
        .select("amount, method, status, reference, students(first_name, last_name)")
        .eq("project_id", projectId)
        .eq("payment_date", date);

      const { data: dayReplacements } = await supabase
        .from("replacements")
        .select("original_date, new_date, status, students(first_name, last_name)")
        .eq("project_id", projectId)
        .eq("original_date", date);

      const photographedToday = dayStudents.filter((s) => s.photo_status === "photographed");
      const absentToday = dayStudents.filter(
        (s) => s.photo_status === "absent" || s.photo_status === "replacement_pending"
      );
      const notParticipatingToday = dayStudents.filter(
        (s) => s.participation_status === "not_participating"
      );

      const cashConfirmed = (dayMovements ?? [])
        .filter((m) => isMovementCollected(m.status))
        .reduce((sum, m) => sum + m.amount, 0);

      addSheet(wb, "Resumen", [
        { Indicador: "Fecha", Valor: date },
        { Indicador: "Salones trabajados", Valor: dayClassrooms.length },
        { Indicador: "Programados", Valor: dayStudents.length },
        { Indicador: "Fotografiados", Valor: photographedToday.length },
        { Indicador: "Ausentes", Valor: absentToday.length },
        { Indicador: "No participantes", Valor: notParticipatingToday.length },
        { Indicador: "Cobrado efectivo", Valor: cashConfirmed },
        { Indicador: "Total confirmado del día", Valor: cashConfirmed },
      ]);

      addSheet(
        wb,
        "Estudiantes atendidos",
        photographedToday.map((s) => ({
          Estudiante: `${s.last_name}, ${s.first_name}`,
          Grado: gradeName(s.grade_id),
          Salón: classroomName(s.classroom_id),
        }))
      );

      addSheet(
        wb,
        "Pagos",
        (dayMovements ?? []).map((m) => {
          const student = m.students as unknown as { first_name: string; last_name: string } | null;
          return {
            Estudiante: student ? `${student.last_name}, ${student.first_name}` : "",
            Monto: m.amount,
            Método: paymentMethodLabel[m.method],
            Estado: paymentStatusLabel[m.status],
            Referencia: m.reference ?? "",
          };
        })
      );

      addSheet(
        wb,
        "Ausencias y reposiciones",
        (dayReplacements ?? []).map((r) => {
          const student = r.students as unknown as { first_name: string; last_name: string } | null;
          return {
            Estudiante: student ? `${student.last_name}, ${student.first_name}` : "",
            "Fecha original": r.original_date,
            "Nueva fecha": r.new_date ?? "",
            Estado: r.status === "completed" ? "Completada" : "Pendiente",
          };
        })
      );

      return toExcelResponse(wb, `reporte_diario_${date}_${projectSlug}.xlsx`);
    }
  }
}
