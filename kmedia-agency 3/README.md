# Kmedia Agency

Aplicación interna de gestión de proyectos de fotografía de graduandos.

## Uso local con doble clic (recomendado)

1. Instala **Node.js** (una sola vez): ve a https://nodejs.org y descarga la versión "LTS".
2. Copia `.env.example`, renombra la copia a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los datos de tu proyecto de Supabase.
3. Corre la migración `supabase/migrations/0001_init.sql` en tu proyecto de Supabase (SQL Editor), y crea tu usuario administrador desde Supabase Auth.
4. Haz doble clic en:
   - **Windows:** `Iniciar-Kmedia.bat`
   - **Mac:** `Iniciar-Kmedia.command` (si macOS bloquea el archivo por venir de internet, haz clic derecho → Abrir, y confirma)
5. La primera vez tardará unos minutos (instala e instala todo lo necesario); las siguientes veces abrirá en segundos. El navegador se abrirá solo en `http://localhost:3000`.

No cierres la ventana negra/terminal que se abre — ahí corre la aplicación mientras la usas. Para salir, simplemente ciérrala.

Si más adelante cambias las credenciales de Supabase en `.env.local`, borra la carpeta `.next` antes de volver a abrir el lanzador, para que tome los nuevos valores.

## Primeros pasos (vía terminal, alternativa)

1. `npm install`
2. Copia `.env.example` a `.env.local` y completa las credenciales de tu proyecto de Supabase.
3. Corre la migración `supabase/migrations/0001_init.sql` en tu proyecto de Supabase (SQL Editor o `supabase db push`).
4. Crea tu primer usuario administrador desde el panel de Supabase Auth (Add user), ya que en la V1 no hay registro público.
5. (Opcional, recomendado) Corre `supabase/seed.sql` para llenar la base con datos ficticios y probar toda la plataforma antes de cargar estudiantes reales — ver más abajo.
6. `npm run dev` y abre http://localhost:3000

## Datos ficticios de prueba (`supabase/seed.sql`)

Este archivo crea dos proyectos de ejemplo pensados para probar cada módulo:

- **Instituto Comercial — Graduandos 2026** (activo): 15 estudiantes en 3
  salones (dos grados, uno de ellos noveno) con paquetes, extras, pagos en
  efectivo y Yappy (confirmado, pendiente de conciliación y rechazado),
  una becada, un "no participa", una ausencia con reposición pendiente y
  otra ya completada, y dos estudiantes de noveno que ya generaron el
  aporte de $1 (uno de ellos con extras incluidos, para probar que nunca
  se duplica el aporte).
- **Colegio ABC — Graduandos 2025** (cerrado, con fecha límite ya vencida):
  pensado específicamente para ver el estado **Moroso** funcionando, más
  una becada que nunca aparece como morosa aunque el proyecto ya cerró.

Verifiqué todos los cálculos (Club de Padres, Fondo de noveno, saldos,
estados) corriendo la migración y el seed contra un Postgres real antes de
entregarlo — los números que verás en el dashboard deberían coincidir
exactamente con lo descrito en los comentarios del archivo.

**Antes de cargar a tus estudiantes reales**, borra estos dos proyectos.
Lo más simple es correr esto en el SQL Editor de Supabase (borra en
cascada todo lo asociado — grados, salones, estudiantes, pagos, etc.):

```sql
delete from projects where id in (
  '030ab90c-82af-5944-9fd4-31cdec16b08c',
  '6c2a3759-6d8c-5d1d-8004-3067dbf533d7'
);
```

## Documentación

- `CLAUDE.md` — resumen de reglas de negocio y estado del proyecto.
- `docs/requirements.md` — alcance funcional y plan de fases.
- `docs/data-model.md` — modelo de datos y decisiones de diseño.
- `docs/business-rules.md` — reglas financieras detalladas y casos de prueba.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm test` — pruebas (reglas financieras)
