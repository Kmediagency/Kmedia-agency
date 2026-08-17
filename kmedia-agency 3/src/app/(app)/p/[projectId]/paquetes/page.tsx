import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createExtra,
  createPackage,
  toggleExtraActive,
  togglePackageActive,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PaquetesPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: grades }, { data: packages }, { data: packageGrades }, { data: extras }] =
    await Promise.all([
      supabase.from("grades").select("id, name").eq("project_id", projectId).order("sort_order"),
      supabase.from("packages").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("package_grades").select("package_id, grade_id"),
      supabase.from("extras").select("*").eq("project_id", projectId).order("created_at"),
    ]);

  const gradesForPackage = (packageId: string) =>
    packageGrades
      ?.filter((pg) => pg.package_id === packageId)
      .map((pg) => grades?.find((g) => g.id === pg.grade_id)?.name)
      .filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      {/* Paquetes */}
      <Card>
        <CardTitle className="mb-4">Paquetes</CardTitle>
        <ul className="mb-5 divide-y divide-slate-100">
          {packages?.map((pkg) => (
            <li key={pkg.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  {pkg.name}
                  {!pkg.active && <Badge tone="neutral">Inactivo</Badge>}
                </div>
                <div className="text-slate-500">
                  ${pkg.price.toFixed(2)}
                  {pkg.description && <span> · {pkg.description}</span>}
                  {gradesForPackage(pkg.id).length > 0 && (
                    <span> · {gradesForPackage(pkg.id).join(", ")}</span>
                  )}
                </div>
              </div>
              <form action={togglePackageActive.bind(null, projectId, pkg.id, !pkg.active)}>
                <button type="submit" className="text-xs text-brand-600 hover:underline">
                  {pkg.active ? "Desactivar" : "Activar"}
                </button>
              </form>
            </li>
          ))}
          {(!packages || packages.length === 0) && (
            <li className="py-2 text-sm text-slate-400">Sin paquetes registrados aún.</li>
          )}
        </ul>
        <form action={createPackage.bind(null, projectId)} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input name="name" label="Nombre" placeholder="Ej: Paquete Graduando" required />
            <Input name="price" label="Precio" type="number" step="0.01" min="0" required />
          </div>
          <Input name="description" label="Descripción (opcional)" />
          {grades && grades.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">
                Grados disponibles (deja vacío para todos)
              </p>
              <div className="flex flex-wrap gap-3">
                {grades.map((g) => (
                  <label key={g.id} className="flex items-center gap-1.5 text-sm text-slate-600">
                    <input type="checkbox" name="grade_ids" value={g.id} className="rounded border-slate-300" />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" variant="secondary">
            + Agregar paquete
          </Button>
        </form>
      </Card>

      {/* Extras */}
      <Card>
        <CardTitle className="mb-4">Extras</CardTitle>
        <ul className="mb-5 divide-y divide-slate-100">
          {extras?.map((extra) => (
            <li key={extra.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{extra.name}</span>
                <span className="ml-2 text-slate-500">${extra.price.toFixed(2)}</span>
                {!extra.active && <Badge tone="neutral">Inactivo</Badge>}
              </div>
              <form action={toggleExtraActive.bind(null, projectId, extra.id, !extra.active)}>
                <button type="submit" className="text-xs text-brand-600 hover:underline">
                  {extra.active ? "Desactivar" : "Activar"}
                </button>
              </form>
            </li>
          ))}
          {(!extras || extras.length === 0) && (
            <li className="py-2 text-sm text-slate-400">Sin extras registrados aún.</li>
          )}
        </ul>
        <form action={createExtra.bind(null, projectId)} className="flex items-end gap-3">
          <Input name="name" label="Nombre" placeholder="Ej: Foto digital adicional" required />
          <Input name="price" label="Precio" type="number" step="0.01" min="0" required className="max-w-[140px]" />
          <Button type="submit" variant="secondary">
            + Agregar extra
          </Button>
        </form>
      </Card>
    </div>
  );
}
