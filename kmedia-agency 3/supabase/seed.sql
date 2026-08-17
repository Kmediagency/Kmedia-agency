-- =========================================================
-- Kmedia Agency — Datos ficticios de prueba (SEED)
-- =========================================================
-- Este archivo llena la base de datos con dos proyectos de ejemplo que
-- cubren todos los escenarios de negocio: becados, morosos, pagos en
-- efectivo y Yappy (confirmado/pendiente/rechazado), ausencias y
-- reposiciones (pendiente y completada), y aportes al colegio.
--
-- USAR SOLO EN UN PROYECTO DE SUPABASE DE PRUEBA. Antes de cargar a los
-- estudiantes reales, borra estos datos con la sección "LIMPIEZA" al final
-- de este archivo (o simplemente elimina los dos proyectos desde la app:
-- Configuración → Estado del proyecto no borra, así que usa el SQL de
-- limpieza).
--
-- Cómo usarlo: pega este archivo completo en el SQL Editor de Supabase
-- (después de correr supabase/migrations/0001_init.sql) y ejecútalo.
-- =========================================================

-- ---------------------------------------------------------
-- PROYECTO 1: Instituto Comercial — Graduandos 2026 (Activo)
-- Fechas de cuota en el futuro -> nadie aparece moroso aquí todavía.
-- ---------------------------------------------------------

insert into projects (id, name, school_name, year, status, start_date, end_date, yappy_number, club_padres_rate, ninth_grade_contribution, installment_2_date, installment_3_date, final_due_date)
values (
  '030ab90c-82af-5944-9fd4-31cdec16b08c',
  'Instituto Comercial — Graduandos 2026',
  'Instituto Comercial',
  2026,
  'active',
  '2026-07-01',
  null,
  '6583-1871',
  0.10,
  1.00,
  '2026-08-31',
  '2026-09-16',
  '2026-09-16'
);

insert into grades (id, project_id, name, is_ninth_grade, sort_order) values
  ('c60f7f41-733e-5417-909b-7acceea48b0d', '030ab90c-82af-5944-9fd4-31cdec16b08c', '12°', false, 1),
  ('b62031bc-43ab-521c-85bf-84216db85212', '030ab90c-82af-5944-9fd4-31cdec16b08c', '9°', true, 2);

insert into classrooms (id, project_id, grade_id, name, photo_date) values
  ('3364c411-7924-5082-848f-f9b8460b52d4', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '12A', '2026-08-19'),
  ('e833b55f-9c0a-5e02-95c9-fec951d7f14c', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '12B', '2026-08-19'),
  ('555d054b-b7cc-5aaf-a1e3-056c644dc4de', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'b62031bc-43ab-521c-85bf-84216db85212', '9A', '2026-08-26');

insert into packages (id, project_id, name, price, description, active) values
  ('f441c49d-b23b-50b2-b929-a1b0217e53ce', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'Paquete Graduando', 45.00, 'Paquete estándar de graduación', true),
  ('f9e86d2a-18e3-5473-a9a5-ae11612c2e32', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'Paquete Certificación', 35.00, 'Paquete para certificación de noveno', true);

insert into package_grades (package_id, grade_id) values
  ('f441c49d-b23b-50b2-b929-a1b0217e53ce', 'c60f7f41-733e-5417-909b-7acceea48b0d'),
  ('f9e86d2a-18e3-5473-a9a5-ae11612c2e32', 'b62031bc-43ab-521c-85bf-84216db85212');

insert into extras (id, project_id, name, price, active) values
  ('41421f93-b5b5-5b4b-a840-6e7c8d151e7b', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'Foto digital adicional', 5.00, true),
  ('487ad09b-fc33-5648-a8d4-a75756a75f75', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'Foto adicional con entrega física', 6.00, true);

-- Estudiantes 12A
insert into students (id, project_id, grade_id, classroom_id, first_name, last_name, phone, email, gown_size, package_id, participation_status, photo_status, photo_date) values
  ('364316eb-c34a-53fe-b3a9-3174e171e81b', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'María', 'González', '6611-2233', 'maria.gonzalez@example.com', 'M', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'photographed', '2026-08-19'),
  ('cb9b5835-1404-52e4-a520-5f7cd0155783', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Carlos', 'Pérez', '6622-3344', 'carlos.perez@example.com', 'L', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'pending', '2026-08-19'),
  ('98ec25a0-57f5-546e-a354-df531d1cd3b4', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Ana', 'Rodríguez', '6633-4455', 'ana.rodriguez@example.com', 'S', null, 'scholarship', 'photographed', '2026-08-19'),
  ('41071c21-0851-51dc-88eb-81b16fdfaae5', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Luis', 'Martínez', '6644-5566', 'luis.martinez@example.com', 'XL', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'photographed', '2026-08-19'),
  ('91de9ae3-5f3f-55d5-bab8-508db809dd47', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Sofía', 'Castillo', '6655-6677', null, null, null, 'not_participating', 'pending', '2026-08-19'),
  ('36f411ec-7520-5b78-89eb-12fec1125c90', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Jorge', 'Herrera', '6666-7788', 'jorge.herrera@example.com', 'L', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'photographed', '2026-08-19'),
  ('edb46adf-2fbc-5bd1-aa3d-421576a72991', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', '3364c411-7924-5082-848f-f9b8460b52d4', 'Patricia', 'Núñez', '6677-8899', 'patricia.nunez@example.com', 'M', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'replacement_pending', '2026-08-19');

-- Estudiantes 12B
insert into students (id, project_id, grade_id, classroom_id, first_name, last_name, phone, email, gown_size, package_id, participation_status, photo_status, photo_date) values
  ('db65d067-3160-55c7-a438-0fdcc5b4d010', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', 'e833b55f-9c0a-5e02-95c9-fec951d7f14c', 'Roberto', 'Díaz', '6688-9900', 'roberto.diaz@example.com', 'XL', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'photographed', '2026-08-19'),
  ('022091c4-6951-57d6-825b-3a810219bde0', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', 'e833b55f-9c0a-5e02-95c9-fec951d7f14c', 'Valentina', 'Ríos', '6699-0011', 'valentina.rios@example.com', 'S', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'pending', '2026-08-19'),
  ('365d2886-9f88-5cf6-afb1-f2c9932dfd73', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', 'e833b55f-9c0a-5e02-95c9-fec951d7f14c', 'Diego', 'Morales', '6600-1122', 'diego.morales@example.com', 'M', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'photographed', '2026-08-19'),
  ('efb2bd96-682d-544e-b0e2-c37ada1939e6', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'c60f7f41-733e-5417-909b-7acceea48b0d', 'e833b55f-9c0a-5e02-95c9-fec951d7f14c', 'Camila', 'Vargas', '6611-3344', 'camila.vargas@example.com', 'L', 'f441c49d-b23b-50b2-b929-a1b0217e53ce', 'purchased', 'replacement_completed', '2026-08-19');

-- Estudiantes 9A
insert into students (id, project_id, grade_id, classroom_id, first_name, last_name, phone, email, gown_size, package_id, participation_status, photo_status, photo_date) values
  ('41b036e0-07cf-5563-87ed-1b86a9fb600d', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'b62031bc-43ab-521c-85bf-84216db85212', '555d054b-b7cc-5aaf-a1e3-056c644dc4de', 'Fernando', 'López', '6622-4455', 'fernando.lopez@example.com', 'M', 'f9e86d2a-18e3-5473-a9a5-ae11612c2e32', 'purchased', 'photographed', '2026-08-26'),
  ('02bbcce9-33d7-55d7-a04c-0306a81a4453', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'b62031bc-43ab-521c-85bf-84216db85212', '555d054b-b7cc-5aaf-a1e3-056c644dc4de', 'Isabella', 'Cruz', '6633-5566', 'isabella.cruz@example.com', 'S', 'f9e86d2a-18e3-5473-a9a5-ae11612c2e32', 'purchased', 'pending', '2026-08-26'),
  ('6a8c8cf1-33ff-5866-b440-a1baab207193', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'b62031bc-43ab-521c-85bf-84216db85212', '555d054b-b7cc-5aaf-a1e3-056c644dc4de', 'Mateo', 'Jiménez', '6644-6677', null, 'M', null, 'scholarship', 'photographed', '2026-08-26'),
  ('12b2b001-cdda-52bf-aa93-e5517886a907', '030ab90c-82af-5944-9fd4-31cdec16b08c', 'b62031bc-43ab-521c-85bf-84216db85212', '555d054b-b7cc-5aaf-a1e3-056c644dc4de', 'Gabriela', 'Torres', '6655-7788', 'gabriela.torres@example.com', 'M', 'f9e86d2a-18e3-5473-a9a5-ae11612c2e32', 'purchased', 'photographed', '2026-08-26');

-- Extras seleccionados
insert into student_extras (student_id, extra_id, quantity) values
  ('364316eb-c34a-53fe-b3a9-3174e171e81b', '41421f93-b5b5-5b4b-a840-6e7c8d151e7b', 2), -- María: 2 fotos digitales
  ('41071c21-0851-51dc-88eb-81b16fdfaae5', '487ad09b-fc33-5648-a8d4-a75756a75f75', 1), -- Luis: 1 foto física
  ('db65d067-3160-55c7-a438-0fdcc5b4d010', '41421f93-b5b5-5b4b-a840-6e7c8d151e7b', 3), -- Roberto: 3 fotos digitales
  ('efb2bd96-682d-544e-b0e2-c37ada1939e6', '41421f93-b5b5-5b4b-a840-6e7c8d151e7b', 1), -- Camila: 1 foto digital
  ('12b2b001-cdda-52bf-aa93-e5517886a907', '487ad09b-fc33-5648-a8d4-a75756a75f75', 1); -- Gabriela: 1 foto física

-- Pagos
insert into payment_movements (project_id, student_id, amount, payment_date, method, reference, status, reconciled_at) values
  -- María: $45 paquete + $10 extras = $55, pagado completo en 3 cuotas (efectivo)
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '364316eb-c34a-53fe-b3a9-3174e171e81b', 25.00, '2026-08-19', 'cash', null, 'confirmed', '2026-08-19'),
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '364316eb-c34a-53fe-b3a9-3174e171e81b', 15.00, '2026-08-31', 'cash', null, 'confirmed', '2026-08-31'),
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '364316eb-c34a-53fe-b3a9-3174e171e81b', 15.00, '2026-09-10', 'cash', null, 'confirmed', '2026-09-10'),
  -- Carlos: paga solo la primera cuota ($15 de $45) -> pago parcial
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'cb9b5835-1404-52e4-a520-5f7cd0155783', 15.00, '2026-08-19', 'cash', null, 'confirmed', '2026-08-19'),
  -- Luis: paga por Yappy, todavía pendiente de conciliación ($21 = 15 + 6 extra)
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '41071c21-0851-51dc-88eb-81b16fdfaae5', 21.00, '2026-08-19', 'yappy', 'YP-10234', 'pending_reconciliation', null),
  -- Roberto: $45 + $15 extras = $60. Primera cuota efectivo $30, segunda Yappy conciliada $15 -> saldo $15
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'db65d067-3160-55c7-a438-0fdcc5b4d010', 30.00, '2026-08-19', 'cash', null, 'confirmed', '2026-08-19'),
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'db65d067-3160-55c7-a438-0fdcc5b4d010', 15.00, '2026-08-31', 'yappy', 'YP-10456', 'confirmed', '2026-08-31'),
  -- Valentina: un Yappy rechazado (monto incorrecto) y luego pagó en efectivo
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '022091c4-6951-57d6-825b-3a810219bde0', 10.00, '2026-08-19', 'yappy', 'YP-10999', 'rejected', null),
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '022091c4-6951-57d6-825b-3a810219bde0', 15.00, '2026-08-20', 'cash', null, 'confirmed', '2026-08-20'),
  -- Camila: $45 + $5 extra = $50, pagado completo de una vez
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'efb2bd96-682d-544e-b0e2-c37ada1939e6', 50.00, '2026-08-19', 'cash', null, 'confirmed', '2026-08-19'),
  -- Jorge: $45 paquete, pagado completo de una vez
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '36f411ec-7520-5b78-89eb-12fec1125c90', 45.00, '2026-08-19', 'cash', null, 'confirmed', '2026-08-19'),
  -- Fernando (9°): $35 pagado completo -> dispara el aporte de noveno ($1)
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '41b036e0-07cf-5563-87ed-1b86a9fb600d', 35.00, '2026-08-26', 'cash', null, 'confirmed', '2026-08-26'),
  -- Isabella (9°): pago parcial, no dispara el aporte de noveno todavía
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '02bbcce9-33d7-55d7-a04c-0306a81a4453', 12.00, '2026-08-26', 'cash', null, 'confirmed', '2026-08-26'),
  -- Gabriela (9°): $35 + $6 extra = $41 pagado completo -> también dispara el aporte de noveno
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', '12b2b001-cdda-52bf-aa93-e5517886a907', 41.00, '2026-08-26', 'cash', null, 'confirmed', '2026-08-26');

-- Reposición de Patricia (ausente) — pendiente
insert into replacements (project_id, student_id, original_date, status) values
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'edb46adf-2fbc-5bd1-aa3d-421576a72991', '2026-08-19', 'pending');

-- Reposición de Camila (ausente) — ya completada
insert into replacements (project_id, student_id, original_date, new_date, status) values
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'efb2bd96-682d-544e-b0e2-c37ada1939e6', '2026-08-19', '2026-08-25', 'completed');

-- Entrega parcial al colegio (lo generado se calcula solo; esto es lo entregado)
insert into school_disbursements (project_id, concept, amount, disbursement_date, method, reference) values
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'club_padres', 15.00, '2026-09-01', 'transfer', 'TR-001'),
  ('030ab90c-82af-5944-9fd4-31cdec16b08c', 'ninth_grade_fund', 1.00, '2026-09-01', 'cash', null);


-- ---------------------------------------------------------
-- PROYECTO 2: Colegio ABC — Graduandos 2025 (Cerrado)
-- Fecha límite ya pasada -> demuestra el estado "Moroso".
-- ---------------------------------------------------------

insert into projects (id, name, school_name, year, status, start_date, end_date, yappy_number, club_padres_rate, ninth_grade_contribution, installment_2_date, installment_3_date, final_due_date)
values (
  '6c2a3759-6d8c-5d1d-8004-3067dbf533d7',
  'Colegio ABC — Graduandos 2025',
  'Colegio ABC',
  2025,
  'closed',
  '2025-07-01',
  '2025-10-01',
  '6583-1871',
  0.10,
  1.00,
  '2025-08-31',
  '2025-09-16',
  '2025-09-16'
);

insert into grades (id, project_id, name, is_ninth_grade, sort_order) values
  ('b28df67c-90e0-58f7-8916-835f6d0a6953', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', '12°', false, 1);

insert into classrooms (id, project_id, grade_id, name, photo_date) values
  ('247dd738-10b4-5e75-8876-cd8de35f3bfd', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'b28df67c-90e0-58f7-8916-835f6d0a6953', '12A', '2025-08-20');

insert into packages (id, project_id, name, price, description, active) values
  ('d1d19668-014b-523f-8c8b-6c33567c0a0b', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'Paquete Graduando', 50.00, 'Paquete estándar de graduación', true);

insert into package_grades (package_id, grade_id) values
  ('d1d19668-014b-523f-8c8b-6c33567c0a0b', 'b28df67c-90e0-58f7-8916-835f6d0a6953');

insert into extras (id, project_id, name, price, active) values
  ('5c9be519-2c29-5e0e-8707-bc764a97fdfc', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'Foto digital adicional', 5.00, true);

insert into students (id, project_id, grade_id, classroom_id, first_name, last_name, phone, email, gown_size, package_id, participation_status, photo_status, photo_date) values
  ('53594c0a-0954-5ec3-b6ef-c36eae6f591f', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'b28df67c-90e0-58f7-8916-835f6d0a6953', '247dd738-10b4-5e75-8876-cd8de35f3bfd', 'Andrés', 'Silva', '6700-1122', 'andres.silva@example.com', 'L', 'd1d19668-014b-523f-8c8b-6c33567c0a0b', 'purchased', 'photographed', '2025-08-20'),
  ('3607d442-0d53-5053-92a7-348a9559c82b', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'b28df67c-90e0-58f7-8916-835f6d0a6953', '247dd738-10b4-5e75-8876-cd8de35f3bfd', 'Daniela', 'Ortiz', '6711-2233', 'daniela.ortiz@example.com', 'M', 'd1d19668-014b-523f-8c8b-6c33567c0a0b', 'purchased', 'photographed', '2025-08-20'),
  ('5ac72551-c0ad-5b91-bc39-378a2addd82a', '6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'b28df67c-90e0-58f7-8916-835f6d0a6953', '247dd738-10b4-5e75-8876-cd8de35f3bfd', 'Kevin', 'Ramos', '6722-3344', null, 'S', null, 'scholarship', 'photographed', '2025-08-20');

insert into payment_movements (project_id, student_id, amount, payment_date, method, reference, status, reconciled_at) values
  -- Andrés: pagó solo $20 de $50, fecha límite ya pasó -> Moroso
  ('6c2a3759-6d8c-5d1d-8004-3067dbf533d7', '53594c0a-0954-5ec3-b6ef-c36eae6f591f', 20.00, '2025-08-20', 'cash', null, 'confirmed', '2025-08-20'),
  -- Daniela: pagó completo -> Pagado completamente
  ('6c2a3759-6d8c-5d1d-8004-3067dbf533d7', '3607d442-0d53-5053-92a7-348a9559c82b', 50.00, '2025-08-20', 'cash', null, 'confirmed', '2025-08-20');
  -- Kevin es Becado: sin pagos, nunca aparece como moroso aunque el proyecto ya cerró.

-- Entrega parcial al colegio: generado = 10% de (20+50) = $7.00; se entregó solo $2
insert into school_disbursements (project_id, concept, amount, disbursement_date, method, reference) values
  ('6c2a3759-6d8c-5d1d-8004-3067dbf533d7', 'club_padres', 2.00, '2025-09-05', 'cash', null);


-- =========================================================
-- LIMPIEZA (ejecutar esto para borrar solo los datos ficticios
-- antes de empezar a cargar estudiantes reales)
-- =========================================================
-- delete from projects where id in (
--   '030ab90c-82af-5944-9fd4-31cdec16b08c',
--   '6c2a3759-6d8c-5d1d-8004-3067dbf533d7'
-- );
-- (Borrar el proyecto borra en cascada grados, salones, paquetes, extras,
--  estudiantes, pagos, reposiciones y entregas asociadas — ver "on delete
--  cascade" en supabase/migrations/0001_init.sql)
