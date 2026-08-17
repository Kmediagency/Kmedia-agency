import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { projectStatusLabel, projectStatusTone } from "@/lib/labels";
import { ProjectSidebar } from "./project-sidebar";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, school_name, status")
    .eq("id", params.projectId)
    .single();

  if (!project) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/proyectos" className="text-sm text-slate-500 hover:text-slate-800">
            ← Todos los proyectos
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            <Badge tone={projectStatusTone[project.status]}>
              {projectStatusLabel[project.status]}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{project.school_name}</p>
        </div>
      </div>

      <div className="flex gap-8">
        <ProjectSidebar projectId={project.id} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
