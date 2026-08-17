-- =========================================================
-- Kmedia Agency — Esquema inicial (FASE 1-6)
-- =========================================================
-- Convenciones:
--   * Todas las tablas usan uuid como primary key.
--   * created_at / updated_at en la mayoría de tablas.
--   * Los totales financieros NUNCA se guardan como campo editable:
--     se calculan a partir de payment_movements y de los precios
--     vigentes de packages/extras (ver docs/business-rules.md).
-- =========================================================

create extension if not exists "pgcrypto";

-- Función genérica para mantener updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- PERFILES (preparado para roles futuros; hoy solo admin)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin', -- futuro: 'admin' | 'editor' | 'viewer'
  created_at timestamptz not null default now()
);

-- =========================================================
-- PROYECTOS (colegio + año)
-- =========================================================
create type project_status as enum ('preparation', 'active', 'closed');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,                     -- ej: "Instituto Comercial — Graduandos 2026"
  school_name text not null,
  year int not null,
  status project_status not null default 'preparation',
  start_date date not null,
  end_date date,

  -- Configuración financiera del proyecto (nunca hardcodeada globalmente)
  yappy_number text,
  club_padres_rate numeric(5,4) not null default 0.10,       -- 10%
  ninth_grade_contribution numeric(10,2) not null default 1.00, -- $1
  installment_2_date date,                -- Cuota 2 (configurable por proyecto)
  installment_3_date date,                -- Cuota 3 (configurable por proyecto)
  final_due_date date,                    -- fecha límite final -> define "moroso"

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- =========================================================
-- GRADOS
-- =========================================================
create table grades (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,                     -- ej: "12°", "9°"
  is_ninth_grade boolean not null default false, -- marca el/los grados que activan el aporte de $1
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);
create index idx_grades_project on grades(project_id);

-- =========================================================
-- SALONES
-- =========================================================
create table classrooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  grade_id uuid not null references grades(id) on delete cascade,
  name text not null,                     -- ej: "12A"
  photo_date date,                        -- fecha de la jornada fotográfica de este salón
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade_id, name)
);
create index idx_classrooms_project on classrooms(project_id);
create index idx_classrooms_grade on classrooms(grade_id);
create index idx_classrooms_photo_date on classrooms(photo_date);
create trigger trg_classrooms_updated_at before update on classrooms
  for each row execute function set_updated_at();

-- =========================================================
-- PAQUETES
-- =========================================================
create table packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_packages_project on packages(project_id);
create trigger trg_packages_updated_at before update on packages
  for each row execute function set_updated_at();

-- Grados para los que un paquete está disponible (N:M)
create table package_grades (
  package_id uuid not null references packages(id) on delete cascade,
  grade_id uuid not null references grades(id) on delete cascade,
  primary key (package_id, grade_id)
);

-- =========================================================
-- EXTRAS
-- =========================================================
create table extras (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_extras_project on extras(project_id);
create trigger trg_extras_updated_at before update on extras
  for each row execute function set_updated_at();

-- =========================================================
-- ESTUDIANTES
-- =========================================================
create type participation_status as enum (
  'undefined', 'purchased', 'not_participating', 'scholarship'
);

create type photo_status as enum (
  'pending', 'photographed', 'absent', 'replacement_pending', 'replacement_completed'
);

create type gown_size as enum ('S', 'M', 'L', 'XL', 'XXL');

create table students (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  grade_id uuid not null references grades(id),
  classroom_id uuid not null references classrooms(id),

  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  track text,                             -- Bachiller / especialidad (opcional)

  gown_size gown_size,
  package_id uuid references packages(id),
  participation_status participation_status not null default 'undefined',

  photo_status photo_status not null default 'pending',
  photo_date date,                        -- heredada del salón; puede sobrescribirse en reposición
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_students_project on students(project_id);
create index idx_students_classroom on students(classroom_id);
create index idx_students_grade on students(grade_id);
create index idx_students_participation on students(participation_status);
create index idx_students_photo_status on students(photo_status);
create index idx_students_name on students(project_id, last_name, first_name);
create trigger trg_students_updated_at before update on students
  for each row execute function set_updated_at();

-- Extras seleccionados por cada estudiante (N:M con cantidad)
create table student_extras (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  extra_id uuid not null references extras(id),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, extra_id)
);
create index idx_student_extras_student on student_extras(student_id);
create trigger trg_student_extras_updated_at before update on student_extras
  for each row execute function set_updated_at();

-- =========================================================
-- PAGOS (movimientos individuales — nunca un total manual)
-- =========================================================
create type payment_method as enum ('cash', 'yappy');
create type payment_status as enum ('pending_reconciliation', 'confirmed', 'rejected');

create table payment_movements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,

  amount numeric(10,2) not null,          -- puede ser negativo únicamente en movimientos de corrección
  payment_date date not null default current_date,
  method payment_method not null,
  reference text,
  status payment_status not null,

  rejection_reason text,                  -- solo aplica si status = 'rejected'
  observation text,

  reversal_of_id uuid references payment_movements(id), -- si este movimiento corrige/revierte otro
  reconciled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index idx_payments_project on payment_movements(project_id);
create index idx_payments_student on payment_movements(student_id);
create index idx_payments_date on payment_movements(payment_date);
create index idx_payments_status on payment_movements(status);
create index idx_payments_method on payment_movements(method);
create trigger trg_payments_updated_at before update on payment_movements
  for each row execute function set_updated_at();

-- =========================================================
-- REPOSICIONES
-- =========================================================
create type replacement_status as enum ('pending', 'completed');

create table replacements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  original_date date not null,
  new_date date,
  status replacement_status not null default 'pending',
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_replacements_project on replacements(project_id);
create index idx_replacements_student on replacements(student_id);
create index idx_replacements_status on replacements(status);
create trigger trg_replacements_updated_at before update on replacements
  for each row execute function set_updated_at();

-- =========================================================
-- ENTREGAS AL COLEGIO
-- (Lo "generado" se calcula siempre desde payment_movements;
--  aquí solo se guarda lo efectivamente entregado)
-- =========================================================
create type contribution_concept as enum ('club_padres', 'ninth_grade_fund');
create type disbursement_method as enum ('cash', 'transfer', 'yappy', 'other');

create table school_disbursements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  concept contribution_concept not null,
  amount numeric(10,2) not null check (amount > 0),
  disbursement_date date not null default current_date,
  method disbursement_method not null,
  reference text,
  observation text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index idx_disbursements_project on school_disbursements(project_id, concept);

-- =========================================================
-- PLANTILLAS DE WHATSAPP
-- =========================================================
create type whatsapp_template_key as enum (
  'balance_due', 'payment_confirmation', 'session_info', 'replacement', 'custom'
);

create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade, -- null = plantilla global por defecto
  key whatsapp_template_key not null,
  name text not null,
  content text not null,                  -- admite variables {nombre} {apellido} {saldo} {total} {paquete} {fecha} {salon}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_wa_templates_project on whatsapp_templates(project_id);
create trigger trg_wa_templates_updated_at before update on whatsapp_templates
  for each row execute function set_updated_at();

-- =========================================================
-- RLS — Fase 1: un solo administrador.
-- Cualquier usuario autenticado tiene acceso completo.
-- Cuando se agreguen roles/permisos por proyecto, estas políticas
-- deben reemplazarse por reglas basadas en membresía de proyecto.
-- =========================================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table grades enable row level security;
alter table classrooms enable row level security;
alter table packages enable row level security;
alter table package_grades enable row level security;
alter table extras enable row level security;
alter table students enable row level security;
alter table student_extras enable row level security;
alter table payment_movements enable row level security;
alter table replacements enable row level security;
alter table school_disbursements enable row level security;
alter table whatsapp_templates enable row level security;

create policy "authenticated full access" on profiles for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on projects for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on grades for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on classrooms for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on packages for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on package_grades for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on extras for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on students for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on student_extras for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on payment_movements for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on replacements for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on school_disbursements for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated full access" on whatsapp_templates for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Crear automáticamente un profile al registrarse un usuario en Supabase Auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
