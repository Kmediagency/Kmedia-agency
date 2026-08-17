import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectStatusLabel, projectStatusTone } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, school_name, year, status, start_date")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="rounded-lg bg-status-dangerBg px-4 py-3 text-status-danger">
        No se pudieron cargar los proyectos: {error.message}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Proyectos</h1>
          <p className="text-sm text-slate-500">Colegios y proyectos de graduandos</p>
        </div>
        <Link href="/proyectos/nuevo">
          <Button>+ Nuevo proyecto</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          Aún no hay proyectos. Crea el primero para comenzar.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/p/${project.id}/dashboard`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="font-medium text-slate-900">{project.name}</h2>
                  <Badge tone={projectStatusTone[project.status]}>
                    {projectStatusLabel[project.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{project.school_name}</p>
                <p className="mt-1 text-sm text-slate-400">Año {project.year}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
