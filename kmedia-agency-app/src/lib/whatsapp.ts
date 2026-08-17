/**
 * Normaliza un número de teléfono a formato internacional para wa.me.
 * Por ahora asume Panamá (+507) si el número no trae código de país, pero
 * queda preparado para otros países en el futuro.
 */
export function normalizePhoneForWhatsApp(phone: string, defaultCountryCode = "507"): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.startsWith(defaultCountryCode) && digitsOnly.length > 8) return digitsOnly;
  if (digitsOnly.length <= 8) return `${defaultCountryCode}${digitsOnly}`;
  return digitsOnly;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppVariables {
  nombre: string;
  apellido: string;
  saldo: string;
  total: string;
  paquete: string;
  fecha: string;
  salon: string;
}

/** Reemplaza {variable} en una plantilla con los valores dados. */
export function applyWhatsAppTemplate(template: string, variables: Partial<WhatsAppVariables>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = variables[key as keyof WhatsAppVariables];
    return value !== undefined ? value : match;
  });
}

export const defaultWhatsAppTemplates = {
  balance_due:
    "Hola {nombre}. Le escribimos de Kmedia Agency con relación a su paquete fotográfico. Actualmente registra un saldo pendiente de ${saldo}. Para cualquier consulta, con gusto podemos ayudarle.",
  payment_confirmation:
    "Hola {nombre}. Confirmamos la recepción de su pago. Su saldo actual es de ${saldo} sobre un total de ${total}. Gracias por su confianza.",
  session_info:
    "Hola {nombre}. Le recordamos que la sesión fotográfica de {salon} está programada para el {fecha}. ¡Le esperamos!",
  replacement:
    "Hola {nombre}. Le escribimos para coordinar su sesión de reposición fotográfica. Quedamos atentos a su disponibilidad.",
  custom: "",
} as const;
