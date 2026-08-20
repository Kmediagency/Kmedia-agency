import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClassroom, deleteClassroom, updateClassroomDate } from "../configuracion/actions";

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
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Jornadas</h1>

      {/* Agregar jornada / salón, directamente desde esta pantalla */}
      <Card>
        <CardTitle className="mb-4">+ Agregar jornada (salón)</CardTitle>
        {grades && grades.length > 0 ? (
          <form
            action={createClassroom.bind(null, projectId)}
            className="flex flex-wrap items-end gap-3"
          >
            <Select name="grade_id" label="Grado" required className="max-w-[160px]">
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Input name="name" label="Salón" placeholder="Ej: 12A" required className="max-w-[140px]" />
            <Input name="photo_date" label="Fecha de jornada" type="date" />
            <Button type="submit" variant="secondary">
              + Agregar salón
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            Primero crea al menos un grado en Configuración para poder agregar salones aquí.
          </p>
        )}
      </Card>

      {(!classrooms || classrooms.length === 0) && (
        <Card className="py-12 text-center text-slate-500">
          No hay salones creados aún. Usa el formulario de arriba para agregar el primero.
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
                  <Card key={classroom.id} className="flex h-full flex-col justify-between">
                    <Link href={`/p/${projectId}/jornadas/${classroom.id}`}>
                      <CardTitle className="mb-1 hover:text-brand-600">
                        {classroom.name}
                        <span className="ml-1 text-slate-400">({grade?.name})</span>
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {counts.programados} programados · {counts.fotografiados} fotografiados ·{" "}
                        {counts.ausentes} ausentes
                      </p>
                    </Link>
                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                      <form
                        action={updateClassroomDate.bind(null, projectId, classroom.id)}
                        className="flex items-end gap-2"
                      >
                        <Input
                          name="photo_date"
                          label="Fecha"
                          type="date"
                          defaultValue={classroom.photo_date ?? ""}
                          className="max-w-[150px]"
                        />
                        <button
                          type="submit"
                          className="pb-2 text-xs text-brand-600 hover:underline"
                        >
                          Guardar
                        </button>
                      </form>
                      <form action={deleteClassroom.bind(null, projectId, classroom.id)}>
                        <button
                          type="submit"
                          className="pb-2 text-xs text-status-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
