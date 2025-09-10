-- Commun Printing - Seed Data
-- Tento skript se spustí po migraci a naplní DB ukázkovými daty.

-- Vložení uživatelů: admin, majitel tiskárny, zákazník
-- Heslo pro všechny je 'password123' (bcrypt hash)
INSERT INTO "users" (id, name, email, password_hash, role, referral_code, stripe_customer_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@communprinting.cz', '$2b$10$fV/bV3I.v.C3Fv3eX.3X.O.g2oY4f.W.5w.1e.4O.3X.O.g2oY4f', 'admin', 'ADMIN_CODE', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Franta Tiskař', 'owner@communprinting.cz', '$2b$10$fV/bV3I.v.C3Fv3eX.3X.O.g2oY4f.W.5w.1e.4O.3X.O.g2oY4f', 'owner', 'TISKAR123', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Karel Zákazník', 'customer@communprinting.cz', '$2b$10$fV/bV3I.v.C3Fv3eX.3X.O.g2oY4f.W.5w.1e.4O.3X.O.g2oY4f', 'customer', NULL, 'cus_xxxxxxxxxxxxxx');

-- Vložení tiskárny pro Frantu Tiskaře
INSERT INTO "printers" (id, owner_id, name, brand, model, max_volume_mm, materials, status, default_rate_per_hour_eur) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Průša MK4 v garáži', 'Prusa', 'Original Prusa MK4',
 '{"x": 250, "y": 210, "z": 220}', '["PLA", "PETG", "ABS"]', 'available', 3.50);

-- Vložení ukázkového 3D modelu pro Karla Zákazníka
INSERT INTO "models" (id, user_id, filename, s3_key, file_type, volume_cm3, bbox_mm, analysis_status, analysis_results) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'test_cube.stl', 'seeds/test_cube.stl', 'stl', 125.0,
 '{"x": 50, "y": 50, "z": 50}', 'completed',
 '{"is_watertight": true}');

-- Vložení ukázkové objednávky, která je již dokončená, aby bylo možné testovat provize
INSERT INTO "orders" (id, user_id, total_cents, currency, status, stripe_payment_intent_id) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 2500, 'EUR', 'delivered', 'pi_xxxxxxxxxxxxxx');

-- Položka v objednávce - tisk modelu na Frantově tiskárně
INSERT INTO "order_items" (id, order_id, model_id, selected_printer_id, type, description, settings, price_breakdown, price_cents) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
 'print', 'Tisk modelu test_cube.stl',
 '{"material": "PETG", "quality": "0.2mm", "supports": true}',
 '{"material_cost": 500, "print_time_cost": 1500, "platform_fee": 500}',
 2500);

-- Záznam transakce pro výplatu (provize pro majitele tiskárny)
INSERT INTO "transactions" (id, order_item_id, owner_id, type, amount_cents) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'commission', 2000); -- 1500 (čas) + 500 (materiál)
