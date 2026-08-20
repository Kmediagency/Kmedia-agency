import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import { getStudentFinancialSummaries } from "@/lib/financial/student-summary";
import { calculateSchoolContributionsGenerated } from "@/lib/financial/school-contributions";
import { isMovementCollected } from "@/lib/financial/calculations";
import { photoStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [
    summaries,
    { clubPadresGenerated, ninthGradeFundGenerated },
    { data: students },
    { data: movements },
    { data: disbursements },
    { data: packages },
  ] = await Promise.all([
    getStudentFinancialSummaries(supabase, projectId),
    calculateSchoolContributionsGenerated(supabase, projectId),
    supabase
      .from("students")
      .select("id, participation_status, photo_status, package_id")
      .eq("project_id", projectId),
    supabase
      .from("payment_movements")
      .select("amount, method, status, payment_date")
      .eq("project_id", projectId),
    supabase.from("school_disbursements").select("amount").eq("project_id", projectId),
    supabase.from("packages").select("id, name").eq("project_id", projectId),
  ]);

  // ---- Estudiantes ----
  const totalStudents = students?.length ?? 0;
  const purchased = students?.filter((s) => s.participation_status === "purchased").length ?? 0;
  const notParticipating =
    students?.filter((s) => s.participation_status === "not_participating").length ?? 0;
  const scholarship = students?.filter((s) => s.participation_status === "scholarship").length ?? 0;
  const photographed = students?.filter((s) => s.photo_status === "photographed").length ?? 0;
  const pendingPhoto = students?.filter((s) => s.photo_status === "pending").length ?? 0;
  const absent = students?.filter((s) => s.photo_status === "absent").length ?? 0;
  const pendingReplacement =
    students?.filter((s) => s.photo_status === "replacement_pending").length ?? 0;

  // ---- Finanzas ----
  const purchasers = summaries.filter((s) => s.participationStatus === "purchased");
  const totalVendido = purchasers.reduce((sum, s) => sum + s.total, 0);
  const totalCobrado = purchasers.reduce((sum, s) => sum + s.collected, 0);
  const totalPorCobrar = purchasers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);
  const pagadosCompletos = purchasers.filter((s) => s.status === "fully_paid").length;
  const pagoParcial = purchasers.filter((s) => s.status === "partial_payment").length;
  const morosos = purchasers.filter((s) => s.status === "delinquent").length;

  const today = new Date().toISOString().slice(0, 10);
  const cobradoHoy = (movements ?? [])
    .filter((m) => isMovementCollected(m.status) && m.payment_date === today)
    .reduce((sum, m) => sum + m.amount, 0);

  // ---- Colegio ----
  const totalGeneradoColegio = clubPadresGenerated + ninthGradeFundGenerated;
  const totalEntregado = (disbursements ?? []).reduce((sum, d) => sum + d.amount, 0);

  // ---- Gráficas ----
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const cobrosPorDia = last7Days.map((date) => ({
    label: date.slice(5),
    value: Math.round(
      (movements ?? [])
        .filter((m) => isMovementCollected(m.status) && m.payment_date === date)
        .reduce((sum, m) => sum + m.amount, 0)
    ),
    color: "#3b5bdb",
  }));

  const paquetesVendidos = (packages ?? []).map((pkg) => ({
    label: pkg.name,
    value: (students ?? []).filter((s) => s.package_id === pkg.id).length,
    color: "#3b5bdb",
  }));

  const estadoFotografico = [
    { label: photoStatusLabel.photographed, value: photographed, color: "#16a34a" },
    { label: photoStatusLabel.pending, value: pendingPhoto, color: "#6b7280" },
    { label: photoStatusLabel.absent, value: absent, color: "#dc2626" },
    { label: photoStatusLabel.replacement_pending, value: pendingReplacement, color: "#d97706" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500">Estudiantes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total registrados" value={totalStudents} />
          <StatCard label="Compraron paquete" value={purchased} />
          <StatCard label="No participan" value={notParticipating} />
          <StatCard label="Becados" value={scholarship} />
          <StatCard label="Fotografiados" value={photographed} />
          <StatCard label="Pendientes" value={pendingPhoto} />
          <StatCard label="Ausentes" value={absent} />
          <StatCard label="Pend. reposición" value={pendingReplacement} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500">Finanzas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total vendido" value={`$${totalVendido.toFixed(2)}`} />
          <StatCard label="Total cobrado" value={`$${totalCobrado.toFixed(2)}`} />
          <StatCard label="Por cobrar" value={`$${totalPorCobrar.toFixed(2)}`} />
          <StatCard label="Cobrado hoy" value={`$${cobradoHoy.toFixed(2)}`} />
          <StatCard label="Pagados completos" value={pagadosCompletos} />
          <StatCard label="Pago parcial" value={pagoParcial} />
          <StatCard label="Morosos" value={morosos} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-500">Colegio</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Club de Padres generado" value={`$${clubPadresGenerated.toFixed(2)}`} />
          <StatCard label="Fondo noveno generado" value={`$${ninthGradeFundGenerated.toFixed(2)}`} />
          <StatCard label="Total generado" value={`$${totalGeneradoColegio.toFixed(2)}`} />
          <StatCard
            label="Pendiente por entregar"
            value={`$${(totalGeneradoColegio - totalEntregado).toFixed(2)}`}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Cobros por día (últimos 7 días)</CardTitle>
          <SimpleBarChart rows={cobrosPorDia} />
        </Card>
        <Card>
          <CardTitle className="mb-4">Estado fotográfico</CardTitle>
          <SimpleBarChart rows={estadoFotografico} />
        </Card>
        {paquetesVendidos.length > 0 && (
          <Card>
            <CardTitle className="mb-4">Paquetes vendidos</CardTitle>
            <SimpleBarChart rows={paquetesVendidos} />
          </Card>
        )}
      </div>
    </div>
  );
}
