import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { contributionConceptLabel, disbursementMethodLabel } from "@/lib/labels";
import { calculateSchoolContributionsGenerated } from "@/lib/financial/school-contributions";
import { registerDisbursement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AportesColegioPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ clubPadresGenerated, ninthGradeFundGenerated }, { data: disbursements }] = await Promise.all([
    calculateSchoolContributionsGenerated(supabase, projectId),
    supabase
      .from("school_disbursements")
      .select("*")
      .eq("project_id", projectId)
      .order("disbursement_date", { ascending: false }),
  ]);

  const clubPadresDelivered =
    disbursements
      ?.filter((d) => d.concept === "club_padres")
      .reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const ninthFundDelivered =
    disbursements
      ?.filter((d) => d.concept === "ninth_grade_fund")
      .reduce((sum, d) => sum + d.amount, 0) ?? 0;

  const totalGenerated = clubPadresGenerated + ninthGradeFundGenerated;
  const totalDelivered = clubPadresDelivered + ninthFundDelivered;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Club de Padres</CardTitle>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${clubPadresGenerated.toFixed(2)}
          </p>
          <p className="text-sm text-slate-500">
            Entregado ${clubPadresDelivered.toFixed(2)} · Pendiente $
            {(clubPadresGenerated - clubPadresDelivered).toFixed(2)}
          </p>
        </Card>
        <Card>
          <CardTitle>Fondo graduación 9.º</CardTitle>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${ninthGradeFundGenerated.toFixed(2)}
          </p>
          <p className="text-sm text-slate-500">
            Entregado ${ninthFundDelivered.toFixed(2)} · Pendiente $
            {(ninthGradeFundGenerated - ninthFundDelivered).toFixed(2)}
          </p>
        </Card>
        <Card>
          <CardTitle>Total</CardTitle>
          <p className="mt-2 text-2xl font-semibold text-slate-900">${totalGenerated.toFixed(2)}</p>
          <p className="text-sm text-slate-500">
            Entregado ${totalDelivered.toFixed(2)} · Pendiente $
            {(totalGenerated - totalDelivered).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Registrar entrega */}
      <Card>
        <CardTitle className="mb-4">Registrar entrega</CardTitle>
        <form action={registerDisbursement.bind(null, projectId)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select name="concept" label="Concepto" required defaultValue="">
              <option value="" disabled>
                Selecciona un concepto
              </option>
              <option value="club_padres">Club de Padres</option>
              <option value="ninth_grade_fund">Fondo de graduación 9.º</option>
            </Select>
            <Input name="amount" label="Monto" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="disbursement_date"
              label="Fecha"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
            <Select name="method" label="Método" defaultValue="cash">
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="yappy">Yappy</option>
              <option value="other">Otro</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="reference" label="Referencia (opcional)" />
            <Input name="observation" label="Observación (opcional)" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Registrar entrega</Button>
          </div>
        </form>
      </Card>

      {/* Historial */}
      <Card className="overflow-x-auto p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <CardTitle>Historial de entregas</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disbursements?.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 text-slate-600">{d.disbursement_date}</td>
                <td className="px-4 py-3">{contributionConceptLabel[d.concept]}</td>
                <td className="px-4 py-3">${d.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-600">{disbursementMethodLabel[d.method]}</td>
                <td className="px-4 py-3 text-slate-600">{d.reference || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{d.observation || "—"}</td>
              </tr>
            ))}
            {(!disbursements || disbursements.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aún no hay entregas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
