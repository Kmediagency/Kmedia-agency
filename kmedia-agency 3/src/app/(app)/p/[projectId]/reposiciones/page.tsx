import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeReplacement, setReplacementDate } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReposicionesPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const projectId = params.projectId;

  const { data: replacements } = await supabase
    .from("replacements")
    .select(
      "id, student_id, original_date, new_date, status, observation, students(id, first_name, last_name, grade_id, classroom_id)"
    )
    .eq("project_id", projectId)
    .order("original_date", { ascending: false });

  const [{ data: grades }, { data: classrooms }] = await Promise.all([
    supabase.from("grades").select("id, name").eq("project_id", projectId),
    supabase.from("classrooms").select("id, name").eq("project_id", projectId),
  ]);

  const pending = replacements?.filter((r) => r.status === "pending") ?? [];
  const completed = replacements?.filter((r) => r.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="mb-4">Reposiciones pendientes ({pending.length})</CardTitle>
        {pending.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No hay reposiciones pendientes.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((r) => {
              const student = r.students as unknown as {
                id: string;
                first_name: string;
                last_name: string;
                grade_id: string;
                classroom_id: string;
              } | null;
              const grade = grades?.find((g) => g.id === student?.grade_id);
              const classroom = classrooms?.find((c) => c.id === student?.classroom_id);

              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="text-sm">
                    <Link
                      href={`/p/${projectId}/estudiantes/${student?.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {student ? `${student.last_name}, ${student.first_name}` : "—"}
                    </Link>
                    <div className="text-slate-500">
                      {grade?.name} · {classroom?.name} · Fecha original: {r.original_date}
                      {r.new_date && ` · Nueva fecha: ${r.new_date}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      action={setReplacementDate.bind(null, projectId, r.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="date"
                        name="new_date"
                        defaultValue={r.new_date ?? ""}
                        className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <Button type="submit" variant="secondary">
                        Asignar fecha
                      </Button>
                    </form>
                    <form
                      action={completeReplacement.bind(null, projectId, r.id, student?.id ?? "")}
                    >
                      <Button type="submit">Marcar completada</Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <CardTitle>Completadas</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Fecha original</th>
              <th className="px-4 py-3">Nueva fecha</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {completed.map((r) => {
              const student = r.students as unknown as {
                first_name: string;
                last_name: string;
              } | null;
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    {student ? `${student.last_name}, ${student.first_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.original_date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.new_date || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">Completada</Badge>
                  </td>
                </tr>
              );
            })}
            {completed.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Sin reposiciones completadas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
