"use client";

import { useRef } from "react";

interface AutoSubmitSelectProps {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
  action: (formData: FormData) => void;
  hiddenFields?: Record<string, string>;
  className?: string;
}

/**
 * Select que envía su formulario apenas cambia el valor. Se usa en pantallas
 * de trabajo rápido (jornada) donde no queremos un botón "Guardar" extra por
 * cada campo.
 */
export function AutoSubmitSelect({
  name,
  defaultValue,
  children,
  action,
  hiddenFields,
  className = "",
}: AutoSubmitSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <select
        name={name}
        defaultValue={defaultValue}
        onChange={() => formRef.current?.requestSubmit()}
        className={`rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      >
        {children}
      </select>
    </form>
  );
}
