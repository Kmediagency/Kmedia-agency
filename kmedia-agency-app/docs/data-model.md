# Modelo de datos — Kmedia Agency

Esquema completo en `supabase/migrations/0001_init.sql`. Este documento
explica las entidades, sus relaciones y las decisiones de diseño que se
apartan de la lista de entidades sugerida originalmente.

## Jerarquía

```
projects (proyecto/colegio)
  └─ grades (grados)
       └─ classrooms (salones)
            └─ students (estudiantes)
```

Todas las tablas de datos "de negocio" tienen `project_id` y las consultas
siempre filtran por él, para que la información de un proyecto nunca se
mezcle con otro.

## Entidades

| Tabla | Propósito |
|---|---|
| `profiles` | Perfil del usuario autenticado (preparado para roles futuros) |
| `projects` | Proyecto/colegio: estado, fechas, configuración financiera |
| `grades` | Grados de un proyecto; `is_ninth_grade` marca el/los grados que activan el aporte de $1 |
| `classrooms` | Salones de un grado; `photo_date` es la fecha de la jornada de ese salón |
| `packages` | Paquetes fotográficos de un proyecto (precio nunca hardcodeado) |
| `package_grades` | Grados para los que un paquete está disponible (N:M) |
| `extras` | Extras de un proyecto (foto digital adicional, etc.) |
| `students` | Estudiantes: datos personales, escolares y fotográficos |
| `student_extras` | Extras seleccionados por estudiante, con cantidad (N:M) |
| `payment_movements` | Movimientos de pago individuales — única fuente de "cuánto se ha pagado" |
| `replacements` | Reposiciones fotográficas |
| `school_disbursements` | Entregas de dinero al colegio (Club de Padres / Fondo noveno) |
| `whatsapp_templates` | Plantillas de mensajes de WhatsApp (Fase 8) |

## Decisiones que se apartan de la lista original de entidades

- **No existe tabla `photo_sessions`.** Una "jornada" es simplemente el
  conjunto de estudiantes de un salón en su `classrooms.photo_date`. No hay
  necesidad de una tabla separada porque un salón tiene una sola fecha de
  jornada a la vez; una reposición individual se maneja en `replacements`,
  no reabriendo una nueva "jornada" para el salón completo.
- **No existe tabla `school_contributions`.** Lo "generado" del Club de
  Padres y del Fondo de noveno se calcula siempre en el momento (a partir de
  `payment_movements` + `students` + `grades.is_ninth_grade`), nunca se
  guarda. Solo se persiste lo efectivamente **entregado**
  (`school_disbursements`). Esto cumple la regla: "los cálculos financieros
  principales nunca dependen de cifras editadas manualmente".
- **`students.package_id` es una relación directa**, no una tabla histórica
  `student_packages`. Un estudiante tiene un solo paquete principal a la vez;
  cambiar de paquete solo actualiza este campo. Los pagos ya registrados
  viven en `payment_movements` y no se tocan, así que no se pierde
  información al cambiar de paquete (regla crítica #10).
- **Estados fotográfico y de participación son campos separados** en
  `students` (`photo_status`, `participation_status`), tal como lo pide el
  negocio — nunca se infiere uno del otro.

## Reversión de pagos

No se borran ni modifican silenciosamente los movimientos de pago. Para
revertir un pago se crea un nuevo movimiento con `amount` negativo y
`reversal_of_id` apuntando al movimiento original. El total cobrado
(`sum(amount) where status = 'confirmed'`) refleja la corrección
automáticamente sin perder el historial.

## Índices

Se agregaron índices sobre las columnas usadas para filtrar y buscar con
frecuencia: `project_id` en casi todas las tablas, `student_id`,
`classroom_id`, fechas (`payment_date`, `photo_date`), `status` de pagos y
`photo_status`/`participation_status` de estudiantes, y un índice compuesto
`(project_id, last_name, first_name)` para que la búsqueda de estudiantes
sea rápida incluso con miles de registros.

## Seguridad (RLS)

Fase 1: cualquier usuario autenticado tiene acceso completo (un solo
administrador). Cuando se agreguen roles y permisos por proyecto, estas
políticas deben reemplazarse por reglas basadas en membresía de proyecto
(por ejemplo, una tabla `project_members` con `user_id` + `project_id` +
`role`, y políticas que verifiquen pertenencia).

## Regenerar tipos de TypeScript

Los tipos en `src/types/database.types.ts` están escritos a mano para
reflejar la migración. Cuando el proyecto esté conectado a un Supabase real,
pueden regenerarse automáticamente:

```
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```
