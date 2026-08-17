# Reglas de negocio — Kmedia Agency

Todas estas reglas están implementadas en `src/lib/financial/calculations.ts`
y verificadas en `src/lib/financial/__tests__/calculations.test.ts`. Ningún
componente debe reimplementar una fórmula financiera: siempre importar de
ese módulo.

## Estados de un estudiante

**Participación** (independiente del estado fotográfico):
`Sin definir` → `Compró paquete` | `No participa` | `Becado`.
Un estudiante "No participa" puede pasar luego a "Compró paquete".

**Estado fotográfico:** `Pendiente` → `Fotografiado` | `Ausente` →
`Reposición pendiente` → `Reposición completada`.
"No participa" no es lo mismo que "Ausente": un estudiante sin paquete no es
automáticamente un ausente.

**Estado financiero** (calculado): `Sin pago` · `Pago parcial` ·
`Pagado completamente` · `Moroso` · `Becado`. Un Becado nunca es moroso.

## Total de compra del estudiante

```
Total = precio del paquete + Σ (precio del extra × cantidad)
```

El precio nunca está hardcodeado: siempre viene de `packages.price` /
`extras.price` vigentes.

## Cuotas

- Cada cuota del paquete debe ser ≥ 1/3 de su valor, pero se permiten montos
  mayores o el pago completo anticipado. No se obliga a pagar tres montos
  idénticos.
- **Los extras se pagan completos junto con la primera cuota.** Primera
  cuota mínima = (precio del paquete ÷ 3) + total de extras.
- Fechas de cuota 2, cuota 3 y fecha límite final son **configurables por
  proyecto** (`projects.installment_2_date`, `installment_3_date`,
  `final_due_date`). La cuota 1 es el día de la sesión fotográfica del
  salón (`classrooms.photo_date`, heredada por el estudiante al crearse).

## Pagos

- Nunca se guarda un "total pagado" manual: siempre se calcula desde
  `payment_movements`.
- **Efectivo** queda `confirmado` automáticamente al registrarse.
- **Yappy** queda `pendiente de conciliación`; solo cuenta como dinero
  cobrado una vez conciliado.
- **Cobrado** = suma de movimientos con `status = 'confirmed'` (incluye
  efectivo confirmado y Yappy conciliado; excluye pendientes y rechazados).
- Para revertir un pago se crea un movimiento de corrección (monto
  negativo), nunca se borra o edita el original en silencio.

## Becados

Solo dos modalidades: Regular y Becado (sin descuentos parciales). Un
Becado:
- Puede participar del proyecto.
- No se considera ingreso regular.
- No genera el 10% del Club de Padres.
- No genera el aporte de $1 de noveno.
- Nunca aparece como moroso.

## Club de Padres

```
Aporte = dinero efectivamente cobrado (paquete + extras) del estudiante × tasa (10% por defecto)
```

Solo estudiantes regulares (`purchased`). La tasa es configurable por
proyecto (`projects.club_padres_rate`), no está fija en el código.

## Fondo de graduación de noveno

Se genera **una sola vez por estudiante**, cuando se cumplen todas estas
condiciones:
- Es regular (no becado).
- Pertenece a un grado marcado `is_ninth_grade = true`.
- Tiene un paquete asignado.
- Ya terminó de pagar su compra requerida (saldo ≤ 0).

El monto es configurable por proyecto (`projects.ninth_grade_contribution`,
$1 por defecto). Como el cálculo depende del **estado actual** del
estudiante (no de un evento que se dispara y se guarda), comprar extras
después de completar el pago nunca genera un segundo aporte: mientras el
estudiante tenga saldo pendiente por los extras nuevos, el aporte
temporalmente no se cuenta como "generado"; al terminar de pagar, vuelve a
ser $1 (nunca $2).

## Entregas al colegio

Lo "generado" del Club de Padres y del Fondo de noveno **siempre se calcula**
a partir de los pagos confirmados; nunca se guarda como una cifra editable.
Solo se registra lo efectivamente entregado
(`school_disbursements`). Pendiente por entregar = Generado − Entregado.
Registrar una entrega nunca modifica cuánto se generó.

## Reglas de integridad financiera (checklist)

1. Los totales se calculan, nunca se escriben manualmente.
2. El total pagado proviene de movimientos válidos.
3. Yappy pendiente de conciliación no se considera cobrado.
4. Yappy conciliado sí se considera cobrado.
5. Efectivo confirmado sí se considera cobrado.
6. Los Becados no generan Club de Padres.
7. Los Becados no generan aporte de noveno.
8. El 10% incluye paquetes y extras efectivamente cobrados de regulares.
9. El aporte de noveno se genera máximo una vez por estudiante.
10. Cambiar de paquete nunca borra pagos anteriores.
11. Los extras se pagan completos en la primera cuota.
12. Moroso = regular con saldo después de la fecha final configurada.
13. Las entregas al colegio no modifican cuánto se generó, solo lo pendiente.

## Casos de prueba (implementados en `calculations.test.ts`)

| # | Escenario | Resultado esperado |
|---|---|---|
| 1 | Paquete $45, pagos efectivo $15+$15+$15 | Pagado $45, saldo $0, Pagado completamente |
| 2 | Paquete $45 + extras $10 = $55 | Primera cuota mínima $25 |
| 3 | Regular paga $55 (con extras) | Club de Padres $5.50 |
| 4 | Becado equivalente a paquete $45 | Club de Padres $0, Fondo noveno $0 |
| 5 | Regular de 9° termina de pagar ($1), luego compra extras | Fondo noveno sigue siendo $1, nunca $2 |
| 6 | Yappy $15 pendiente → luego conciliado | Cobrado $0 → luego $15 |
| 7 | Regular con saldo después de la fecha final | Moroso |
| 8 | Cambia de paquete $35 → $45 tras pagar $20 | Pagado sigue $20, saldo $25 |

Correr las pruebas: `npm test`.
