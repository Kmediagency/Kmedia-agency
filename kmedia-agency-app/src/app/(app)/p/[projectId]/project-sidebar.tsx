"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Solo se listan aquí los módulos ya implementados. A medida que avancen las
 * siguientes fases (jornadas, pagos, conciliación Yappy, reposiciones,
 * paquetes y extras, aportes al colegio, reportes, dashboard) se irán
 * agregando en este mismo arreglo — nunca un enlace que no lleve a algo
 * funcional.
 */
function navItems(projectId: string) {
  return [
    { href: `/p/${projectId}/dashboard`, label: "Dashboard" },
    { href: `/p/${projectId}/estudiantes`, label: "Estudiantes" },
    { href: `/p/${projectId}/jornadas`, label: "Jornadas" },
    { href: `/p/${projectId}/pagos`, label: "Pagos" },
    { href: `/p/${projectId}/conciliacion-yappy`, label: "Conciliación Yappy" },
    { href: `/p/${projectId}/reposiciones`, label: "Reposiciones" },
    { href: `/p/${projectId}/paquetes`, label: "Paquetes y Extras" },
    { href: `/p/${projectId}/aportes-colegio`, label: "Aportes al Colegio" },
    { href: `/p/${projectId}/reportes`, label: "Reportes" },
    { href: `/p/${projectId}/configuracion`, label: "Configuración" },
  ];
}

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const items = navItems(projectId);

  return (
    <nav className="w-48 shrink-0">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
