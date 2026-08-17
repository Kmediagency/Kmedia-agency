import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { participationStatusLabel, participationStatusTone, photoStatusLabel, photoStatusTone } from "@/lib/labels";
import { sanitizeSearchTerm } from "@/lib/search";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface SearchParams {
  q?: string;
  grade_id?: string;
  classroom_id?: string;
  participation_status?: string;
  page?: string;
}

export default async function EstudiantesPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const projectId = params.projectId;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [{ data: grades }, { data: classrooms }] = await Promise.all([
    supabase.from("grades").select("id, name").eq("project_id", projectId).order("sort_order"),
    supabase.from("classrooms").select("id, name, grade_id").eq("project_id", projectId).order("name"),
  ]);

  let query = supabase
    .from("students")
    .select(
      "id, first_name, last_name, phone, email, gown_size, participation_status, photo_status, grade_id, classroom_id",
      { count: "exact" }
    )
    .eq("project_id", projectId)
    .order("last_name");

  if (searchParams.q) {
    const q = sanitizeSearchTerm(searchParams.q);
    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
      );
    }
  }
  if (searchParams.grade_id) query = query.eq("grade_id", searchParams.grade_id);
  if (searchParams.classroom_id) query = query.eq("classroom_id", searchParams.classroom_id);
  if (searchParams.participation_status)
    query = query.eq("participation_status", searchParams.participation_status as never);

  const from = (page - 1) * PAGE_SIZE;
  const { data: students, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const hasSetup = (grades?.length ?? 0) > 0 && (classrooms?.length ?? 0) > 0;

  // Conserva los filtros activos al cambiar de página
  const buildPageHref = (targetPage: number) => {
    const qs = new URLSearchParams();
    if (searchParams.q) qs.set("q", searchParams.q);
    if (searchParams.grade_id) qs.set("grade_id", searchParams.grade_id);
    if (searchParams.classroom_id) qs.set("classroom_id", searchParams.classroom_id);
    if (searchParams.participation_status)
      qs.set("participation_status", searchParams.participation_status);
    qs.set("page", String(targetPage));
    return `?${qs.toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Estudiantes</h1>
          <p className="text-sm text-slate-500">
            {totalCount} estudiante{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        {hasSetup && (
          <Link href={`/p/${projectId}/estudiantes/nuevo`}>
            <Button>+ Agregar estudiante</Button>
          </Link>
        )}
      </div>

      {!hasSetup ? (
        <Card className="py-12 text-center text-slate-500">
          Primero define al menos un grado y un salón en{" "}
          <Link href={`/p/${projectId}/configuracion`} className="text-brand-600 hover:underline">
            Configuración
          </Link>{" "}
          para poder agregar estudiantes.
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <form className="flex flex-wrap items-end gap-3" method="get">
              <Input
                name="q"
                label="Buscar"
                placeholder="Nombre, apellido, teléfono o correo"
                defaultValue={searchParams.q}
                className="min-w-[220px]"
              />
              <Select name="grade_id" label="Grado" defaultValue={searchParams.grade_id ?? ""}>
                <option value="">Todos</option>
                {grades?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <Select
                name="classroom_id"
                label="Salón"
                defaultValue={searchParams.classroom_id ?? ""}
              >
                <option value="">Todos</option>
                {classrooms?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                name="participation_status"
                label="Participación"
                defaultValue={searchParams.participation_status ?? ""}
              >
                <option value="">Todas</option>
                {Object.entries(participationStatusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </form>
          </Card>

          <Card className="overflow-x-auto p-0">
            {error ? (
              <p className="p-6 text-status-danger">No se pudo cargar la lista: {error.message}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Estudiante</th>
                    <th className="px-4 py-3">Grado / Salón</th>
                    <th className="px-4 py-3">Talla</th>
                    <th className="px-4 py-3">Participación</th>
                    <th className="px-4 py-3">Estado fotográfico</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students?.map((s) => {
                    const grade = grades?.find((g) => g.id === s.grade_id);
                    const classroom = classrooms?.find((c) => c.id === s.classroom_id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {s.last_name}, {s.first_name}
                          </div>
                          <div className="text-xs text-slate-400">{s.phone || s.email || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {grade?.name} · {classroom?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.gown_size ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={participationStatusTone[s.participation_status]}>
                            {participationStatusLabel[s.participation_status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={photoStatusTone[s.photo_status]}>
                            {photoStatusLabel[s.photo_status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/p/${projectId}/estudiantes/${s.id}`}
                            className="text-brand-600 hover:underline"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {students?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No hay estudiantes con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={buildPageHref(page - 1)}>
                    <Button type="button" variant="secondary">
                      ← Anterior
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={buildPageHref(page + 1)}>
                    <Button type="button" variant="secondary">
                      Siguiente →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
