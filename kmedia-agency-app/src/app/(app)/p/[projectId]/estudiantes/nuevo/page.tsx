import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createStudent } from "../actions";
import { gownSizes } from "@/lib/labels";

export default async function NuevoEstudiantePage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const [{ data: grades }, { data: classrooms }] = await Promise.all([
    supabase
      .from("grades")
      .select("id, name")
      .eq("project_id", params.projectId)
      .order("sort_order"),
    supabase
      .from("classrooms")
      .select("id, name, grade_id")
      .eq("project_id", params.projectId)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Agregar estudiante</h1>
      <Card>
        <form action={createStudent.bind(null, params.projectId)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" name="first_name" required />
            <Input label="Apellido" name="last_name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select name="grade_id" label="Grado" required defaultValue="">
              <option value="" disabled>
                Selecciona un grado
              </option>
              {grades?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Select name="classroom_id" label="Salón" required defaultValue="">
              <option value="" disabled>
                Selecciona un salón
              </option>
              {classrooms?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Bachiller / especialidad (opcional)" name="track" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" placeholder="6XXX-XXXX" />
            <Input label="Correo" name="email" type="email" />
          </div>
          <Select name="gown_size" label="Talla de toga (opcional)" defaultValue="">
            <option value="">Sin definir</option>
            {gownSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
          <div className="flex justify-end pt-2">
            <Button type="submit">Guardar estudiante</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
