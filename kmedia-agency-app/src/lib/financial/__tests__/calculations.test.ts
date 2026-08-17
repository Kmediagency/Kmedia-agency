import { describe, expect, it } from "vitest";
import {
  calculateBalance,
  calculateClubPadresContribution,
  calculateCollectedTotal,
  calculateFinancialStatus,
  calculateMinimumFirstInstallment,
  calculateNinthGradeContribution,
  calculateStudentTotal,
} from "../calculations";

describe("Reglas financieras críticas (docs/business-rules.md)", () => {
  it("Caso 1: 3 pagos en efectivo que suman el total del paquete -> Pagado completamente", () => {
    const total = calculateStudentTotal(45, []);
    const collected = calculateCollectedTotal([
      { amount: 15, status: "confirmed" },
      { amount: 15, status: "confirmed" },
      { amount: 15, status: "confirmed" },
    ]);
    expect(collected).toBe(45);
    expect(calculateBalance(total, collected)).toBe(0);
    expect(
      calculateFinancialStatus({
        participationStatus: "purchased",
        total,
        collected,
        today: new Date("2026-09-01"),
        finalDueDate: new Date("2026-09-16"),
      })
    ).toBe("fully_paid");
  });

  it("Caso 2: paquete $45 + extras $10 -> primera cuota mínima $25", () => {
    const extras = [{ unitPrice: 5, quantity: 2 }];
    const total = calculateStudentTotal(45, extras);
    expect(total).toBe(55);
    expect(calculateMinimumFirstInstallment(45, extras)).toBe(25);
  });

  it("Caso 3: regular paga $55 (incluye extras) -> Club de Padres $5.50", () => {
    const contribution = calculateClubPadresContribution({
      participationStatus: "purchased",
      collected: 55,
      rate: 0.1,
    });
    expect(contribution).toBe(5.5);
  });

  it("Caso 4: Becado equivalente a paquete $45 -> Club de Padres $0 y Fondo noveno $0", () => {
    const clubPadres = calculateClubPadresContribution({
      participationStatus: "scholarship",
      collected: 45,
      rate: 0.1,
    });
    const ninthFund = calculateNinthGradeContribution({
      participationStatus: "scholarship",
      isNinthGrade: true,
      hasPackage: true,
      total: 45,
      collected: 45,
      contributionAmount: 1,
    });
    expect(clubPadres).toBe(0);
    expect(ninthFund).toBe(0);
  });

  it("Caso 5: estudiante regular de noveno paga completo -> $1; compra extras luego -> sigue siendo $1", () => {
    const first = calculateNinthGradeContribution({
      participationStatus: "purchased",
      isNinthGrade: true,
      hasPackage: true,
      total: 45,
      collected: 45,
      contributionAmount: 1,
    });
    expect(first).toBe(1);

    // Compra extras: el total sube y momentáneamente queda saldo pendiente
    const afterExtraPurchasePending = calculateNinthGradeContribution({
      participationStatus: "purchased",
      isNinthGrade: true,
      hasPackage: true,
      total: 50, // 45 + 5 de extra
      collected: 45,
      contributionAmount: 1,
    });
    expect(afterExtraPurchasePending).toBe(0); // temporalmente no cuenta, hay saldo

    // Termina de pagar el extra: sigue siendo $1, nunca $2
    const afterExtraPaid = calculateNinthGradeContribution({
      participationStatus: "purchased",
      isNinthGrade: true,
      hasPackage: true,
      total: 50,
      collected: 50,
      contributionAmount: 1,
    });
    expect(afterExtraPaid).toBe(1);
  });

  it("Caso 6: pago Yappy $15 pendiente de conciliación -> $0 cobrado; tras conciliar -> $15", () => {
    const pending = calculateCollectedTotal([{ amount: 15, status: "pending_reconciliation" }]);
    expect(pending).toBe(0);

    const reconciled = calculateCollectedTotal([{ amount: 15, status: "confirmed" }]);
    expect(reconciled).toBe(15);
  });

  it("Caso 7: estudiante regular con saldo después de la fecha final -> Moroso", () => {
    const status = calculateFinancialStatus({
      participationStatus: "purchased",
      total: 45,
      collected: 20,
      today: new Date("2026-09-20"),
      finalDueDate: new Date("2026-09-16"),
    });
    expect(status).toBe("delinquent");
  });

  it("Caso 8: cambia de paquete $35 -> $45 tras pagar $20 -> pagado sigue $20, saldo $25", () => {
    const collected = calculateCollectedTotal([{ amount: 20, status: "confirmed" }]);
    const newTotal = calculateStudentTotal(45, []);
    expect(collected).toBe(20);
    expect(calculateBalance(newTotal, collected)).toBe(25);
  });

  it("Un Becado nunca es moroso, incluso después de la fecha final", () => {
    const status = calculateFinancialStatus({
      participationStatus: "scholarship",
      total: 45,
      collected: 0,
      today: new Date("2026-09-20"),
      finalDueDate: new Date("2026-09-16"),
    });
    expect(status).toBe("scholarship");
  });

  it("Estudiante sin paquete asignado: el total es solo el de los extras", () => {
    const extras = [{ unitPrice: 5, quantity: 2 }];
    expect(calculateStudentTotal(null, extras)).toBe(10);
    expect(calculateMinimumFirstInstallment(null, extras)).toBe(10);
  });

  it("Estudiante 'No participa' o 'Sin definir' nunca aparece como moroso", () => {
    const status = calculateFinancialStatus({
      participationStatus: "not_participating",
      total: 0,
      collected: 0,
      today: new Date("2026-09-20"),
      finalDueDate: new Date("2026-09-16"),
    });
    expect(status).toBe("no_payment");
  });

  it("Un pago revertido (movimiento de corrección negativo) reduce el cobrado correctamente", () => {
    const collected = calculateCollectedTotal([
      { amount: 20, status: "confirmed" },
      { amount: -20, status: "confirmed" }, // reversa
    ]);
    expect(collected).toBe(0);
  });

  it("Un movimiento rechazado nunca cuenta como cobrado", () => {
    const collected = calculateCollectedTotal([{ amount: 15, status: "rejected" }]);
    expect(collected).toBe(0);
  });
});
