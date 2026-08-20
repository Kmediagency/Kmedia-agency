import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createClassroom,
  createGrade,
  deleteClassroom,
  deleteGrade,
  setProjectStatus,
  updateProjectSettings,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: project }, { data: grades }, { data: classrooms }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("grades").select("*").eq("project_id", projectId).order("sort_order"),
    supabase
      .from("classrooms")
      .select("id, name, photo_date, grade_id")
      .eq("project_id", projectId)
      .order("name"),
  ]);

  if (!project) return null;

  const updateSettings = updateProjectSettings.bind(null, projectId);

  return (
    <div className="space-y-6">
      {/* Datos generales y financieros */}
      <Card>
        <CardTitle className="mb-4">Datos del proyecto</CardTitle>
        <form action={updateSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del proyecto" name="name" defaultValue={project.name} required />
            <Input label="Colegio" name="school_name" defaultValue={project.school_name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Año" name="year" type="number" defaultValue={project.year} required />
            <Input
              label="Fecha de inicio"
              name="start_date"
              type="date"
              defaultValue={project.start_date}
              required
            />
          </div>
          <Input
            label="Fecha de finalización"
            name="end_date"
            type="date"
            defaultValue={project.end_date ?? ""}
          />

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Fechas de cuotas y fecha límite
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Cuota 2"
                name="installment_2_date"
                type="date"
                defaultValue={project.installment_2_date ?? ""}
                hint="Cuota 1 = día de la sesión del salón"
              />
              <Input
                label="Cuota 3"
                name="installment_3_date"
                type="date"
                defaultValue={project.installment_3_date ?? ""}
              />
              <Input
                label="Fecha límite final"
                name="final_due_date"
                type="date"
                defaultValue={project.final_due_date ?? ""}
                hint="Después de esta fecha, saldo pendiente = moroso"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </Card>

      {/* Estado del proyecto */}
      <Card>
        <CardTitle className="mb-4">Estado del proyecto</CardTitle>
        <div className="flex gap-2">
          {(["preparation", "active", "closed"] as const).map((status) => (
            <form key={status} action={setProjectStatus.bind(null, projectId, status)}>
              <Button
                type="submit"
                variant={project.status === status ? "primary" : "secondary"}
              >
                {status === "preparation" && "Preparación"}
                {status === "active" && "Activo"}
                {status === "closed" && "Cerrado"}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      {/* Grados */}
      <Card>
        <CardTitle className="mb-4">Grados</CardTitle>
        <ul className="mb-4 divide-y divide-slate-100">
          {grades?.map((grade) => (
            <li key={grade.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {grade.name}
                {grade.is_ninth_grade && (
                  <span className="ml-2 text-xs text-brand-600">
                    (genera aporte de noveno)
                  </span>
                )}
              </span>
              <form action={deleteGrade.bind(null, projectId, grade.id)}>
                <button className="text-xs text-status-danger hover:underline" type="submit">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
          {(!grades || grades.length === 0) && (
            <li className="py-2 text-sm text-slate-400">Sin grados registrados aún.</li>
          )}
        </ul>
        <form action={createGrade.bind(null, projectId)} className="flex items-end gap-3">
          <Input name="name" placeholder="Ej: 12°" required className="max-w-[160px]" />
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input type="checkbox" name="is_ninth_grade" className="rounded border-slate-300" />
            Es noveno grado (genera aporte de $1)
          </label>
          <Button type="submit" variant="secondary">
            + Agregar grado
          </Button>
        </form>
      </Card>

      {/* Salones */}
      <Card>
        <CardTitle className="mb-4">Salones</CardTitle>
        <ul className="mb-4 divide-y divide-slate-100">
          {classrooms?.map((classroom) => {
            const grade = grades?.find((g) => g.id === classroom.grade_id);
            return (
              <li key={classroom.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {classroom.name}
                  <span className="ml-2 text-slate-400">({grade?.name ?? "—"})</span>
                  {classroom.photo_date && (
                    <span className="ml-2 text-slate-400">· {classroom.photo_date}</span>
                  )}
                </span>
                <form action={deleteClassroom.bind(null, projectId, classroom.id)}>
                  <button className="text-xs text-status-danger hover:underline" type="submit">
                    Eliminar
                  </button>
                </form>
              </li>
            );
          })}
          {(!classrooms || classrooms.length === 0) && (
            <li className="py-2 text-sm text-slate-400">Sin salones registrados aún.</li>
          )}
        </ul>
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
          <p className="text-sm text-slate-400">Agrega al menos un grado para poder crear salones.</p>
        )}
      </Card>
    </div>
  );
}
