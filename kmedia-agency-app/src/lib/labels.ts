import type { ParticipationStatus, PhotoStatus, ProjectStatus } from "@/types/database.types";

export const projectStatusLabel: Record<ProjectStatus, string> = {
  preparation: "Preparación",
  active: "Activo",
  closed: "Cerrado",
};

export const projectStatusTone: Record<ProjectStatus, "success" | "warning" | "neutral"> = {
  preparation: "warning",
  active: "success",
  closed: "neutral",
};

export const participationStatusLabel: Record<ParticipationStatus, string> = {
  undefined: "Sin definir",
  purchased: "Compró paquete",
  not_participating: "No participa",
  scholarship: "Becado",
};

export const participationStatusTone: Record<
  ParticipationStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  undefined: "neutral",
  purchased: "success",
  not_participating: "neutral",
  scholarship: "warning",
};

export const photoStatusLabel: Record<PhotoStatus, string> = {
  pending: "Pendiente",
  photographed: "Fotografiado",
  absent: "Ausente",
  replacement_pending: "Reposición pendiente",
  replacement_completed: "Reposición completada",
};

export const photoStatusTone: Record<
  PhotoStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  pending: "neutral",
  photographed: "success",
  absent: "danger",
  replacement_pending: "warning",
  replacement_completed: "success",
};

export const gownSizes = ["S", "M", "L", "XL", "XXL"] as const;

export const financialStatusLabel: Record<
  "no_payment" | "partial_payment" | "fully_paid" | "delinquent" | "scholarship",
  string
> = {
  no_payment: "Sin pago",
  partial_payment: "Pago parcial",
  fully_paid: "Pagado completamente",
  delinquent: "Moroso",
  scholarship: "Becado",
};

export const financialStatusTone: Record<
  "no_payment" | "partial_payment" | "fully_paid" | "delinquent" | "scholarship",
  "success" | "warning" | "danger" | "neutral"
> = {
  no_payment: "neutral",
  partial_payment: "warning",
  fully_paid: "success",
  delinquent: "danger",
  scholarship: "warning",
};

export const paymentMethodLabel: Record<"cash" | "yappy", string> = {
  cash: "Efectivo",
  yappy: "Yappy",
};

export const paymentStatusLabel: Record<
  "pending_reconciliation" | "confirmed" | "rejected",
  string
> = {
  pending_reconciliation: "Pendiente de conciliación",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

export const paymentStatusTone: Record<
  "pending_reconciliation" | "confirmed" | "rejected",
  "success" | "warning" | "danger"
> = {
  pending_reconciliation: "warning",
  confirmed: "success",
  rejected: "danger",
};

export const contributionConceptLabel: Record<"club_padres" | "ninth_grade_fund", string> = {
  club_padres: "Club de Padres",
  ninth_grade_fund: "Fondo de graduación 9.º",
};

export const disbursementMethodLabel: Record<"cash" | "transfer" | "yappy" | "other", string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  yappy: "Yappy",
  other: "Otro",
};
