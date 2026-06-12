USE vending_machine;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM machine_events;
DELETE FROM dispense_commands;
DELETE FROM wallet_transactions;
DELETE FROM payments;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM inventory;
DELETE FROM slots;
DELETE FROM products;
DELETE FROM machines;
DELETE FROM wallets;
DELETE FROM users;

ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE wallets AUTO_INCREMENT = 1;
ALTER TABLE machines AUTO_INCREMENT = 1;
ALTER TABLE slots AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE inventory AUTO_INCREMENT = 1;
ALTER TABLE sales AUTO_INCREMENT = 1;
ALTER TABLE sale_items AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE wallet_transactions AUTO_INCREMENT = 1;
ALTER TABLE dispense_commands AUTO_INCREMENT = 1;
ALTER TABLE machine_events AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Demo passwords are not stored in plain text. They are bcrypt hashes for:
-- admin@example.com: Admin@123
-- cliente@example.com: Cliente@123
INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES
  (1, 'Admin Vending', 'admin@example.com', '$2b$10$QR4auZicdgrTIEUXJ7vehO9IHJQ1m.7msRr7yTXLrf2mRwPjGQZRi', 'ADMIN', 1, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  (2, 'Cliente Demo', 'cliente@example.com', '$2b$10$vcOVrQsro/tOGutJ0dMMq.jGG/fGC4lyK6ncEE5ANDW3O0o.rnx7S', 'USER', 1, '2026-06-01 09:05:00', '2026-06-01 09:05:00');

INSERT INTO wallets (
  id,
  user_id,
  balance_cents,
  created_at,
  updated_at
) VALUES
  (1, 1, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  (2, 2, 3850, '2026-06-01 09:05:00', '2026-06-09 14:10:00');

INSERT INTO machines (
  id,
  name,
  slug,
  location,
  status,
  mqtt_base_topic,
  last_seen_at,
  firmware_version,
  is_active,
  created_at,
  updated_at
) VALUES (
  1,
  'Vending Hall Principal',
  'hall-principal',
  'Bloco A - Hall Principal',
  'ONLINE',
  'vending/1',
  '2026-06-09 14:10:00',
  '0.2.0',
  1,
  '2026-06-01 10:00:00',
  '2026-06-09 14:10:00'
);

INSERT INTO slots (
  id,
  machine_id,
  code,
  motor_id,
  sensor_column_id,
  is_enabled,
  created_at,
  updated_at
) VALUES
  (1, 1, 'A1', 1, 1, 1, '2026-06-01 10:05:00', '2026-06-01 10:05:00'),
  (2, 1, 'A2', 2, 2, 1, '2026-06-01 10:06:00', '2026-06-01 10:06:00'),
  -- A ESP32-S3 fisica atual da maquina 1 aceita venda apenas nos pares motor/sensor 1/1 e 2/2.
  -- Slots extras ficam cadastrados para administracao e historico, mas desabilitados para venda.
  (3, 1, 'B1', 3, 3, 0, '2026-06-01 10:07:00', '2026-06-01 10:07:00'),
  (4, 1, 'B2', 4, 4, 0, '2026-06-01 10:08:00', '2026-06-01 10:08:00');

INSERT INTO products (
  id,
  sku,
  name,
  description,
  category,
  price_cents,
  image_path,
  is_active,
  created_at,
  updated_at
) VALUES
  (1, 'AGUA-500ML', 'Agua Mineral 500ml', 'Garrafa de agua mineral sem gas.', 'Bebidas', 500, '/uploads/products/agua-500ml.png', 1, '2026-06-01 11:00:00', '2026-06-01 11:00:00'),
  (2, 'COLA-350ML', 'Refrigerante Cola 350ml', 'Lata de refrigerante sabor cola.', 'Bebidas', 700, '/uploads/products/cola-350ml.png', 1, '2026-06-01 11:05:00', '2026-06-01 11:05:00'),
  (3, 'SNACK-CHIPS', 'Salgadinho Chips', 'Pacote individual de salgadinho.', 'Snacks', 650, '/uploads/products/salgadinho-chips.png', 1, '2026-06-01 11:10:00', '2026-06-01 11:10:00'),
  (4, 'CHOC-BARRA', 'Chocolate em Barra', 'Barra de chocolate ao leite.', 'Doces', 800, '/uploads/products/chocolate-barra.png', 1, '2026-06-01 11:15:00', '2026-06-01 11:15:00');

INSERT INTO inventory (
  id,
  machine_id,
  slot_id,
  product_id,
  quantity_available,
  quantity_reserved,
  min_quantity_alert,
  created_at,
  updated_at
) VALUES
  (1, 1, 1, 1, 9, 0, 3, '2026-06-01 12:00:00', '2026-06-05 10:05:00'),
  (2, 1, 2, 2, 8, 0, 3, '2026-06-01 12:05:00', '2026-06-06 11:08:00'),
  (3, 1, 3, 3, 12, 1, 4, '2026-06-01 12:10:00', '2026-06-09 14:10:00'),
  (4, 1, 4, 4, 6, 0, 2, '2026-06-01 12:15:00', '2026-06-01 12:15:00');

INSERT INTO payments (
  id,
  user_id,
  type,
  provider,
  provider_payment_id,
  amount_cents,
  status,
  mock_qr_code,
  mock_copy_paste,
  expires_at,
  paid_at,
  created_at,
  updated_at
) VALUES (
  1,
  2,
  'MOCK_TOPUP',
  'MOCK',
  'mock-topup-0001',
  5000,
  'PAID',
  'mock://qr-code/topup/0001',
  'MOCK-TOPUP-0001-5000',
  '2026-06-01 10:30:00',
  '2026-06-01 09:30:00',
  '2026-06-01 09:25:00',
  '2026-06-01 09:30:00'
);

INSERT INTO sales (
  id,
  user_id,
  machine_id,
  status,
  payment_method,
  total_cents,
  failure_reason,
  created_at,
  updated_at
) VALUES
  (1, 2, 1, 'DISPENSED', 'WALLET', 500, NULL, '2026-06-05 10:00:00', '2026-06-05 10:05:00'),
  (2, 2, 1, 'REFUNDED', 'WALLET', 700, 'PRODUCT_NOT_DETECTED', '2026-06-06 11:00:00', '2026-06-06 11:08:00'),
  (3, 2, 1, 'DISPENSING', 'WALLET', 650, NULL, '2026-06-09 14:10:00', '2026-06-09 14:10:00');

INSERT INTO sale_items (
  id,
  sale_id,
  product_id,
  slot_id,
  quantity,
  unit_price_cents,
  total_cents,
  created_at
) VALUES
  (1, 1, 1, 1, 1, 500, 500, '2026-06-05 10:00:00'),
  (2, 2, 2, 2, 1, 700, 700, '2026-06-06 11:00:00'),
  (3, 3, 3, 3, 1, 650, 650, '2026-06-09 14:10:00');

INSERT INTO wallet_transactions (
  id,
  wallet_id,
  user_id,
  sale_id,
  payment_id,
  type,
  amount_cents,
  status,
  reference_type,
  reference_id,
  description,
  created_at
) VALUES
  (1, 2, 2, NULL, 1, 'CREDIT', 5000, 'COMPLETED', 'MOCK_TOPUP', 1, 'Recarga mock inicial para demonstracao.', '2026-06-01 09:30:00'),
  (2, 2, 2, 1, NULL, 'DEBIT', 500, 'COMPLETED', 'SALE', 1, 'Compra de Agua Mineral 500ml.', '2026-06-05 10:00:00'),
  (3, 2, 2, 2, NULL, 'DEBIT', 700, 'COMPLETED', 'SALE', 2, 'Compra de Refrigerante Cola 350ml.', '2026-06-06 11:00:00'),
  (4, 2, 2, 2, NULL, 'REFUND', 700, 'COMPLETED', 'REFUND', 2, 'Estorno por falha de dispensacao.', '2026-06-06 11:08:00'),
  (5, 2, 2, 3, NULL, 'DEBIT', 650, 'COMPLETED', 'SALE', 3, 'Compra de Salgadinho Chips em dispensacao.', '2026-06-09 14:10:00');

INSERT INTO dispense_commands (
  id,
  command_uuid,
  sale_id,
  machine_id,
  product_id,
  slot_id,
  motor_id,
  sensor_column_id,
  status,
  mqtt_topic,
  payload_json,
  attempts_allowed,
  attempts_reported,
  last_error,
  published_at,
  completed_at,
  created_at,
  updated_at
) VALUES
  (
    1,
    '11111111-1111-4111-8111-111111111111',
    1,
    1,
    1,
    1,
    1,
    1,
    'SUCCESS',
    'vending/1/actions',
    JSON_OBJECT('type', 'DISPENSE', 'command_id', '11111111-1111-4111-8111-111111111111', 'sale_id', 1, 'machine_id', 1, 'product_id', 1, 'slot_id', 1, 'slot_code', 'A1', 'quantity', 1),
    2,
    1,
    NULL,
    '2026-06-05 10:01:00',
    '2026-06-05 10:05:00',
    '2026-06-05 10:00:00',
    '2026-06-05 10:05:00'
  ),
  (
    2,
    '22222222-2222-4222-8222-222222222222',
    2,
    1,
    2,
    2,
    2,
    2,
    'FAILED',
    'vending/1/actions',
    JSON_OBJECT('type', 'DISPENSE', 'command_id', '22222222-2222-4222-8222-222222222222', 'sale_id', 2, 'machine_id', 1, 'product_id', 2, 'slot_id', 2, 'slot_code', 'A2', 'quantity', 1),
    2,
    2,
    'PRODUCT_NOT_DETECTED',
    '2026-06-06 11:01:00',
    '2026-06-06 11:07:00',
    '2026-06-06 11:00:00',
    '2026-06-06 11:07:00'
  ),
  (
    3,
    '33333333-3333-4333-8333-333333333333',
    3,
    1,
    3,
    3,
    3,
    3,
    'PUBLISHED',
    'vending/1/actions',
    JSON_OBJECT('type', 'DISPENSE', 'command_id', '33333333-3333-4333-8333-333333333333', 'sale_id', 3, 'machine_id', 1, 'product_id', 3, 'slot_id', 3, 'slot_code', 'B1', 'quantity', 1),
    2,
    0,
    NULL,
    '2026-06-09 14:10:30',
    NULL,
    '2026-06-09 14:10:00',
    '2026-06-09 14:10:30'
  );

INSERT INTO machine_events (
  id,
  machine_id,
  sale_id,
  dispense_command_id,
  event_type,
  payload_json,
  occurred_at,
  created_at,
  updated_at
) VALUES
  (1, 1, NULL, NULL, 'HEARTBEAT', JSON_OBJECT('type', 'HEARTBEAT', 'machine_id', 1, 'status', 'ONLINE'), '2026-06-09 14:09:30', '2026-06-09 14:09:30', '2026-06-09 14:09:30'),
  (2, 1, 1, 1, 'DISPENSE_SUCCESS', JSON_OBJECT('type', 'DISPENSE_SUCCESS', 'sale_id', 1, 'slot_code', 'A1'), '2026-06-05 10:05:00', '2026-06-05 10:05:00', '2026-06-05 10:05:00'),
  (3, 1, 2, 2, 'DISPENSE_FAILED', JSON_OBJECT('type', 'DISPENSE_FAILED', 'sale_id', 2, 'slot_code', 'A2', 'reason', 'PRODUCT_NOT_DETECTED'), '2026-06-06 11:07:00', '2026-06-06 11:07:00', '2026-06-06 11:07:00'),
  (4, 1, 3, 3, 'DISPENSE_STARTED', JSON_OBJECT('type', 'DISPENSE_STARTED', 'sale_id', 3, 'slot_code', 'B1'), '2026-06-09 14:10:40', '2026-06-09 14:10:40', '2026-06-09 14:10:40');
