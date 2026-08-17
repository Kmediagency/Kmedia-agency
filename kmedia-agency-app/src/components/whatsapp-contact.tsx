"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import {
  applyWhatsAppTemplate,
  buildWhatsAppLink,
  defaultWhatsAppTemplates,
  type WhatsAppVariables,
} from "@/lib/whatsapp";

const templateOptions = [
  { key: "balance_due", label: "Saldo pendiente" },
  { key: "payment_confirmation", label: "Confirmación de pago" },
  { key: "session_info", label: "Información de sesión" },
  { key: "replacement", label: "Reposición" },
  { key: "custom", label: "Mensaje personalizado" },
] as const;

export function WhatsAppContact({
  phone,
  variables,
}: {
  phone: string;
  variables: WhatsAppVariables;
}) {
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState<keyof typeof defaultWhatsAppTemplates>("balance_due");
  const [message, setMessage] = useState(() =>
    applyWhatsAppTemplate(defaultWhatsAppTemplates.balance_due, variables)
  );

  const handleTemplateChange = (key: keyof typeof defaultWhatsAppTemplates) => {
    setTemplateKey(key);
    setMessage(applyWhatsAppTemplate(defaultWhatsAppTemplates[key], variables));
  };

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Contactar por WhatsApp
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Select
        label="Plantilla"
        value={templateKey}
        onChange={(e) => handleTemplateChange(e.target.value as keyof typeof defaultWhatsAppTemplates)}
      >
        {templateOptions.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </Select>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Mensaje (puedes editarlo)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <a href={buildWhatsAppLink(phone, message)} target="_blank" rel="noopener noreferrer">
          <Button type="button">Abrir WhatsApp</Button>
        </a>
      </div>
    </div>
  );
}
