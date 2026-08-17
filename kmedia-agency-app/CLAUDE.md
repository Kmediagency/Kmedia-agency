# CLAUDE.md — Kmedia Agency

Este archivo resume lo esencial del proyecto para que no sea necesario volver a
explicarlo en futuras sesiones. Los documentos completos están en `docs/`.

## Qué es esto

Aplicación web interna para **Kmedia Agency** (agencia de fotografía) que
administra proyectos de fotografía de graduandos y certificaciones escolares:
estudiantes, pagos, jornadas fotográficas, reposiciones, aportes al colegio y
reportes. Un solo administrador por ahora; el modelo de datos ya está
preparado para agregar roles más adelante.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase
(Postgres + Auth) · Zod para validación · SheetJS/XLSX para Excel (Fase 2/8).

## Estructura del proyecto

```
src/app/(app)/                    -- Área autenticada (requiere login)
  proyectos/                      -- Listado y creación de proyectos
  p/[projectId]/                  -- Todo lo que ocurre DENTRO de un proyecto
    configuracion/                -- Datos del proyecto, grados, salones
    estudiantes/                  -- Listado, alta, ficha de estudiante
    (los módulos de fases siguientes se agregan aquí mismo)
src/lib/financial/calculations.ts -- ÚNICA fuente de verdad de cálculos financieros
src/lib/supabase/                 -- Clientes de Supabase (browser y server)
src/middleware.ts                 -- Protección de rutas
supabase/migrations/0001_init.sql -- Esquema completo de base de datos
```

## Jerarquía de datos

```
PROYECTO (colegio + año)
  → GRADOS
    → SALONES
      → ESTUDIANTES
```

Los datos de un proyecto (estudiantes, pagos, paquetes, jornadas, reportes)
**nunca se mezclan** con los de otro proyecto. Todas las queries filtran por
`project_id`.

## Reglas de negocio esenciales

Ver `docs/business-rules.md` para el detalle y los 8 casos de prueba. Resumen:

1. **Totales nunca se escriben a mano.** Se calculan siempre desde
   `payment_movements` (pagos) y los precios vigentes de `packages`/`extras`.
2. **Cobrado ≠ Vendido.** Efectivo se confirma automáticamente. Yappy solo
   cuenta como cobrado una vez conciliado (`status = 'confirmed'`).
3. **Cuotas:** cada cuota del paquete ≥ 1/3 de su valor, pero se permiten
   montos mayores o el pago completo anticipado. Los extras se pagan
   completos junto con la primera cuota.
4. **Fechas de cuotas y fecha límite son configurables por proyecto**
   (`projects.installment_2_date`, `installment_3_date`, `final_due_date`),
   nunca hardcodeadas globalmente.
5. **Becado:** nunca genera Club de Padres, nunca genera aporte de noveno,
   nunca aparece como moroso.
6. **Club de Padres = 10%** (configurable, `projects.club_padres_rate`) sobre
   dinero efectivamente cobrado (paquete + extras) de estudiantes regulares.
7. **Fondo de noveno = $1** (configurable, `projects.ninth_grade_contribution`)
   por estudiante regular de un grado marcado `is_ninth_grade = true`, una
   sola vez, cuando termina de pagar su compra requerida. Es un valor
   calculado a partir del estado actual (no un evento acumulable), por lo que
   comprar extras después nunca genera un segundo aporte.
8. **Cambiar de paquete nunca borra pagos anteriores;** el sistema recalcula
   total y saldo automáticamente.
9. **Entregas al colegio** solo reducen "pendiente por entregar"; nunca
   modifican cuánto se generó (lo generado siempre es calculado, no editable).
10. Todas estas reglas viven exclusivamente en `src/lib/financial/calculations.ts`.
    Ningún componente debe reimplementar una fórmula financiera.

## Cosas explícitamente fuera de la V1

Edición/carga de fotos, impresión, empaque, entrega física, inventario de
togas, gastos operativos/nómina, roles complejos, API de WhatsApp (solo
enlaces `wa.me`), alertas automáticas, SMS, correos automáticos, PDF,
historial completo de cambios administrativos, modo jornada independiente
(la pantalla de salón/jornada cumple esa función).

## Estado de avance

Ver el plan de fases completo en `docs/requirements.md`. **Decisión del
cliente:** la importación masiva de estudiantes (plantilla Excel) se deja
para el final del proyecto; el resto de fases avanza primero. Estado actual:

- ✅ **Fase 1**: base del proyecto, autenticación, base de datos, proyectos,
  grados, salones, estudiantes (CRUD manual, búsqueda y filtros).
- ✅ **Fase 2**: paquetes, extras, asignación a estudiantes.
- ✅ **Fase 3**: pagos, cuotas, Yappy, conciliación.
- ✅ **Fase 4**: jornadas, estados fotográficos, ausencias, reposiciones.
- ✅ **Fase 5**: Club de Padres, fondo noveno, entregas al colegio.
- ✅ **Fase 6**: dashboard, gráficas (barras simples, sin librerías externas).
- ✅ **Fase 7**: reportes Excel (diario multi-hoja, general, estudiantes,
  pagos, morosos, reposiciones, aportes al colegio), enlaces de WhatsApp
  (con vista previa editable antes de abrir), pulido visual básico.
- ✅ **Fase 8**: pruebas adicionales de casos límite (13 pruebas en total),
  revisión de cálculos (se centralizó `isMovementCollected` para no repetir
  la condición "confirmado = cobrado" en dashboard y reportes), seguridad
  (saneamiento del término de búsqueda antes de interpolarlo en el filtro
  `.or()` de PostgREST, auditoría de que toda acción de servidor valida su
  entrada), optimización (paginación de 50 en 50 en el listado de
  estudiantes con `count: "exact"` en vez de traer todo el proyecto).
- ⬜ Fase 9: plantilla Excel e importación masiva de estudiantes.

## Cómo trabajar en este proyecto

- Revisar el código existente antes de modificar; reutilizar componentes de
  `src/components/ui`.
- No agregar módulos de fases futuras dentro de pantallas de fases actuales
  (ya pasó una vez: se quitó un botón de WhatsApp que se había colado en la
  ficha del estudiante — eso es Fase 7).
- La navegación lateral del proyecto (`project-sidebar.tsx`) solo debe listar
  módulos ya implementados; nunca un enlace que no lleve a algo funcional.
- Antes de dar por terminado un cambio: `npm run lint`, `npm run typecheck`,
  `npm test` (pruebas financieras).
