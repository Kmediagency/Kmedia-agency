/**
 * Reglas financieras centrales de Kmedia Agency.
 *
 * IMPORTANTE: estas son las ÚNICAS funciones que deben usarse para calcular
 * totales, saldos, cobros y aportes al colegio. Ningún componente debe
 * reimplementar esta lógica. Ver docs/business-rules.md para el detalle
 * de cada regla y sus casos de prueba (docs/business-rules.md, sección
 * "Pruebas importantes").
 */

export type PaymentMethod = "cash" | "yappy";
export type PaymentStatus = "pending_reconciliation" | "confirmed" | "rejected";
export type ParticipationStatus =
  | "undefined"
  | "purchased"
  | "not_participating"
  | "scholarship";

export interface PaymentMovementLike {
  amount: number;
  status: PaymentStatus;
}

export interface ExtraSelectionLike {
  unitPrice: number;
  quantity: number;
}

/**
 * Total de extras seleccionados por un estudiante.
 */
export function calculateExtrasTotal(extras: ExtraSelectionLike[]): number {
  return round2(extras.reduce((sum, e) => sum + e.unitPrice * e.quantity, 0));
}

/**
 * Total de compra del estudiante = precio del paquete + total de extras.
 * Un estudiante sin paquete (packagePrice = null) solo tiene el total de extras.
 */
export function calculateStudentTotal(
  packagePrice: number | null,
  extras: ExtraSelectionLike[]
): number {
  const extrasTotal = calculateExtrasTotal(extras);
  return round2((packagePrice ?? 0) + extrasTotal);
}

/**
 * "Cobrado": dinero efectivamente recibido y confirmado.
 * - Efectivo: confirmado automáticamente al registrarse.
 * - Yappy: solo cuenta una vez conciliado (status = 'confirmed').
 * Los movimientos de corrección/reversa (amount negativo) se incluyen porque
 * restan del total cobrado tal como deben.
 */
/**
 * Único lugar que define qué movimiento cuenta como "cobrado". Cualquier
 * filtro sobre pagos confirmados (por día, por método, etc.) debe usar esto
 * en vez de comparar `status === "confirmed"` directamente.
 */
export function isMovementCollected(status: PaymentStatus): boolean {
  return status === "confirmed";
}

export function calculateCollectedTotal(movements: PaymentMovementLike[]): number {
  return round2(
    movements.filter((m) => isMovementCollected(m.status)).reduce((sum, m) => sum + m.amount, 0)
  );
}

export function calculateBalance(total: number, collected: number): number {
  return round2(total - collected);
}

/**
 * Primera cuota mínima requerida = 1/3 del paquete + 100% de los extras.
 * Si no hay paquete, la primera cuota mínima es simplemente el total de extras.
 */
export function calculateMinimumFirstInstallment(
  packagePrice: number | null,
  extras: ExtraSelectionLike[]
): number {
  const packageMinimum = packagePrice ? packagePrice / 3 : 0;
  const extrasTotal = calculateExtrasTotal(extras);
  return round2(packageMinimum + extrasTotal);
}

/**
 * Monto mínimo permitido para cualquier cuota del paquete (no aplica a extras,
 * que deben pagarse completos junto con la primera cuota).
 */
export function calculateMinimumInstallment(packagePrice: number): number {
  return round2(packagePrice / 3);
}

export type FinancialStatus =
  | "no_payment"
  | "partial_payment"
  | "fully_paid"
  | "delinquent"
  | "scholarship";

/**
 * Estado financiero del estudiante. Un Becado nunca es moroso.
 */
export function calculateFinancialStatus(params: {
  participationStatus: ParticipationStatus;
  total: number;
  collected: number;
  today: Date;
  finalDueDate: Date | null;
}): FinancialStatus {
  const { participationStatus, total, collected, today, finalDueDate } = params;

  if (participationStatus === "scholarship") return "scholarship";
  if (participationStatus !== "purchased") return "no_payment";

  const balance = calculateBalance(total, collected);

  if (balance <= 0 && total > 0) return "fully_paid";

  const isPastDue = finalDueDate !== null && today > finalDueDate;
  if (isPastDue && balance > 0) return "delinquent";

  if (collected > 0) return "partial_payment";
  return "no_payment";
}

/**
 * Aporte al Club de Padres (10% configurable por proyecto) sobre el dinero
 * EFECTIVAMENTE COBRADO de un estudiante regular (paquete + extras).
 * Los Becados nunca generan este aporte.
 */
export function calculateClubPadresContribution(params: {
  participationStatus: ParticipationStatus;
  collected: number;
  rate: number; // ej. 0.10
}): number {
  const { participationStatus, collected, rate } = params;
  if (participationStatus !== "purchased") return 0;
  return round2(collected * rate);
}

/**
 * Aporte de $1 (configurable) para estudiantes regulares de noveno grado que
 * ya terminaron de pagar su compra requerida. Se genera máximo una vez por
 * estudiante: como se calcula a partir del estado actual (no de un evento),
 * comprar extras después de completar el pago nunca genera un segundo aporte.
 */
export function calculateNinthGradeContribution(params: {
  participationStatus: ParticipationStatus;
  isNinthGrade: boolean;
  hasPackage: boolean;
  total: number;
  collected: number;
  contributionAmount: number; // ej. 1.00
}): number {
  const {
    participationStatus,
    isNinthGrade,
    hasPackage,
    total,
    collected,
    contributionAmount,
  } = params;

  if (participationStatus !== "purchased") return 0;
  if (!isNinthGrade || !hasPackage) return 0;
  if (total <= 0) return 0;

  const isFullyPaid = calculateBalance(total, collected) <= 0;
  return isFullyPaid ? round2(contributionAmount) : 0;
}

/** Evita errores de coma flotante en montos monetarios. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
