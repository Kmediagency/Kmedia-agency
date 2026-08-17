import { createProject } from "../actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NuevoProyectoPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Nuevo proyecto</h1>
      <Card>
        <form action={createProject} className="space-y-4">
          <Input
            label="Nombre del proyecto"
            name="name"
            placeholder="Ej: Instituto Comercial — Graduandos 2026"
            required
          />
          <Input label="Colegio" name="school_name" placeholder="Ej: Instituto Comercial" required />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Año"
              name="year"
              type="number"
              defaultValue={currentYear}
              required
            />
            <Input label="Fecha de inicio" name="start_date" type="date" required />
          </div>
          <Input
            label="Yappy utilizado"
            name="yappy_number"
            placeholder="Ej: 6583-1871"
            hint="Puedes cambiarlo luego en Configuración"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit">Crear proyecto</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
