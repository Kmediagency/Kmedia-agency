import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function JornadasPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: classrooms }, { data: grades }, { data: students }] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, name, grade_id, photo_date")
      .eq("project_id", projectId)
      .order("photo_date", { ascending: true, nullsFirst: false })
      .order("name"),
    supabase.from("grades").select("id, name").eq("project_id", projectId),
    supabase
      .from("students")
      .select("id, classroom_id, photo_status, participation_status")
      .eq("project_id", projectId),
  ]);

  const groupedByDate = new Map<string, typeof classrooms>();
  for (const classroom of classrooms ?? []) {
    const key = classroom.photo_date ?? "Sin fecha asignada";
    if (!groupedByDate.has(key)) groupedByDate.set(key, []);
    groupedByDate.get(key)!.push(classroom);
  }

  const countsFor = (classroomId: string) => {
    const inClassroom = (students ?? []).filter((s) => s.classroom_id === classroomId);
    return {
      programados: inClassroom.length,
      fotografiados: inClassroom.filter((s) => s.photo_status === "photographed").length,
      ausentes: inClassroom.filter(
        (s) => s.photo_status === "absent" || s.photo_status === "replacement_pending"
      ).length,
    };
  };

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Jornadas</h1>

      {(!classrooms || classrooms.length === 0) && (
        <Card className="py-12 text-center text-slate-500">
          No hay salones creados aún. Ve a Configuración para agregarlos.
        </Card>
      )}

      <div className="space-y-6">
        {Array.from(groupedByDate.entries()).map(([date, classroomsOnDate]) => (
          <div key={date}>
            <h2 className="mb-2 text-sm font-medium text-slate-500">
              {date === "Sin fecha asignada" ? date : `Fecha: ${date}`}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classroomsOnDate?.map((classroom) => {
                const grade = grades?.find((g) => g.id === classroom.grade_id);
                const counts = countsFor(classroom.id);
                return (
                  <Link key={classroom.id} href={`/p/${projectId}/jornadas/${classroom.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardTitle className="mb-1">
                        {classroom.name}
                        <span className="ml-1 text-slate-400">({grade?.name})</span>
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {counts.programados} programados · {counts.fotografiados} fotografiados ·{" "}
                        {counts.ausentes} ausentes
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
