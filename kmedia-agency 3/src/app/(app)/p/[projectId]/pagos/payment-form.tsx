"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerPayment } from "./actions";
import type { StudentFinancialSummary } from "@/lib/financial/student-summary";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Registrando..." : "Registrar pago"}
    </Button>
  );
}

export function PaymentForm({
  projectId,
  purchasers,
}: {
  projectId: string;
  purchasers: StudentFinancialSummary[];
}) {
  const action = registerPayment.bind(null, projectId);
  const [state, formAction] = useFormState(action, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <Select name="student_id" label="Estudiante" required defaultValue="">
        <option value="" disabled>
          Selecciona un estudiante
        </option>
        {purchasers.map((s) => (
          <option key={s.studentId} value={s.studentId}>
            {s.lastName}, {s.firstName} — saldo ${s.balance.toFixed(2)}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input name="amount" label="Monto" type="number" step="0.01" min="0.01" required />
        <Input
          name="payment_date"
          label="Fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select name="method" label="Método" defaultValue="cash">
          <option value="cash">Efectivo</option>
          <option value="yappy">Yappy</option>
        </Select>
        <Input name="reference" label="Referencia (obligatoria para Yappy)" />
      </div>
      <Input name="observation" label="Observación (opcional)" />
      {state.error && (
        <p className="rounded-lg bg-status-dangerBg px-3 py-2 text-sm text-status-danger">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
