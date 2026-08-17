"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Kmedia Agency</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de proyectos de fotografía de graduandos
          </p>
        </div>
        <Card>
          <form action={formAction} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              autoComplete="email"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
            {state.error && (
              <p className="rounded-lg bg-status-dangerBg px-3 py-2 text-sm text-status-danger">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>
        </Card>
      </div>
    </div>
  );
}
