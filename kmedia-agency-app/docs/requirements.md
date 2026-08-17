# Requisitos — Kmedia Agency

## Objetivo

Aplicación web interna para gestionar proyectos de fotografía de graduandos y
certificaciones escolares de varios colegios, sin mezclar información entre
proyectos. Prioridad: facilidad de uso → control de estudiantes → control de
pagos → jornadas fotográficas → dashboard financiero → reportes → múltiples
colegios.

Un solo administrador por ahora; la estructura de datos no debe impedir
agregar usuarios y permisos en el futuro (ver `profiles` en el esquema).

## Módulos funcionales (alcance completo del MVP)

1. **Proyectos** — crear, editar, abrir, cerrar. Cada uno con colegio, año,
   estado, fechas, configuración financiera (Yappy, fechas de cuotas).
2. **Grados y salones** — por proyecto.
3. **Estudiantes** — datos personales, escolares y fotográficos; estado de
   participación separado del estado fotográfico.
4. **Importación de estudiantes** — plantilla Excel propia, vista previa,
   validación de columnas obligatorias, confirmación.
5. **Paquetes y extras** — precios nunca hardcodeados; un paquete principal
   por estudiante (puede cambiar); extras con cantidad.
6. **Pagos** — movimientos individuales (nunca un campo manual de total);
   efectivo y Yappy; cuotas mínimas de 1/3; conciliación de Yappy.
7. **Jornadas fotográficas** — por salón; pantalla rápida con acciones sin
   salir de la vista (pago, talla, estado fotográfico).
8. **Ausencias y reposiciones** — se generan automáticamente al marcar
   ausente; nueva fecha individual; se cierran al completarse.
9. **Aportes al colegio** — Club de Padres (10%) y Fondo de graduación de
   noveno ($1), ambos calculados, nunca editados a mano; registro de
   entregas con historial.
10. **Dashboard** — por proyecto: estudiantes, finanzas, método de pago,
    colegio; gráficas simples.
11. **Búsqueda y filtros** — rápidos incluso con miles de estudiantes.
12. **Reportes Excel** — diario (con varias hojas), general, estudiantes,
    pagos, morosos, reposiciones, aportes al colegio.
13. **WhatsApp** — solo enlaces `wa.me` con plantillas y variables; sin API
    de Meta.
14. **Seguridad** — autenticación con Supabase, RLS, validación en servidor,
    sin claves privadas en el frontend.

Ver el detalle de reglas financieras en `docs/business-rules.md` y el
modelo de datos completo en `docs/data-model.md`.

## Fuera de alcance en la V1

Edición/selección de fotografías, impresión, empaque, entrega final de
fotografías, inventario de togas, gastos operativos de la agencia, nómina,
fotógrafos/colaboradores, roles complejos, API de WhatsApp, alertas
automáticas de cuotas, SMS, correos automáticos, PDF, historial completo de
cambios administrativos, modo jornada independiente, control de cantidad
esperada de estudiantes por salón.

## Plan de fases

| Fase | Contenido |
|---|---|
| 1 | Base del proyecto, autenticación, base de datos, proyectos, grados, salones, estudiantes |
| 2 | Paquetes, extras, asignación a estudiantes |
| 3 | Pagos, cuotas, Yappy, conciliación |
| 4 | Jornadas, estados fotográficos, ausencias, reposiciones |
| 5 | Club de Padres, fondo noveno, entregas al colegio |
| 6 | Dashboard, gráficas |
| 7 | Reportes Excel, enlaces de WhatsApp, pulido visual |
| 8 | Pruebas, revisión de cálculos, seguridad, optimización |
| 9 | Plantilla Excel e importación masiva de estudiantes *(decisión del cliente: se deja para el final)* |

Estado actual de cada fase: ver `CLAUDE.md`. La búsqueda y los filtros de
estudiantes ya se implementaron en la Fase 1 junto con el CRUD manual.

## Experiencia de usuario esperada

Minimizar clics. Ejemplo de flujo de trabajo con un salón (12A): abrir
jornada → ver estudiantes → registrar pago → editar talla → marcar
fotografiado/ausente, todo sin navegar entre pantallas separadas
(esto se implementa en la Fase 5, en la misma pantalla de salón/jornada).

## Diseño visual

Interfaz administrativa moderna, limpia, profesional. Fondo claro, tarjetas
con bordes suavemente redondeados, tipografía clara, navegación lateral,
tablas legibles, responsive con prioridad a escritorio/tablet. Colores de
estado consistentes (ver `src/lib/labels.ts`): verde = completado/conciliado/
pagado, amarillo = parcial/pendiente, rojo = moroso/rechazado/ausente,
gris = sin definir/no participa. El color nunca es la única señal — siempre
va acompañado de texto.
