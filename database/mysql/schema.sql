CREATE DATABASE IF NOT EXISTS vending_machine
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vending_machine;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS machine_events;
DROP TABLE IF EXISTS dispense_commands;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN', 'OPERATOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wallets_user_id (user_id),
  CONSTRAINT chk_wallets_balance_non_negative CHECK (balance_cents >= 0),
  CONSTRAINT fk_wallets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE machines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  location VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
  mqtt_base_topic VARCHAR(255) NULL,
  last_seen_at DATETIME NULL,
  firmware_version VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_machines_slug (slug),
  CONSTRAINT chk_machines_status CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE slots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  motor_id INT NOT NULL,
  sensor_column_id INT NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slots_machine_code (machine_id, code),
  UNIQUE KEY uk_slots_machine_motor (machine_id, motor_id),
  UNIQUE KEY uk_slots_machine_id_id (machine_id, id),
  KEY idx_slots_machine_id (machine_id),
  CONSTRAINT chk_slots_motor_positive CHECK (motor_id > 0),
  CONSTRAINT chk_slots_sensor_positive CHECK (sensor_column_id > 0),
  CONSTRAINT fk_slots_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  price_cents INT NOT NULL,
  image_path VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_sku (sku),
  KEY idx_products_name (name),
  KEY idx_products_category (category),
  CONSTRAINT chk_products_price_non_negative CHECK (price_cents >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  slot_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  min_quantity_alert INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventory_slot (slot_id),
  KEY idx_inventory_machine_id (machine_id),
  KEY idx_inventory_product_id (product_id),
  CONSTRAINT chk_inventory_quantity_available_non_negative CHECK (quantity_available >= 0),
  CONSTRAINT chk_inventory_quantity_reserved_non_negative CHECK (quantity_reserved >= 0),
  CONSTRAINT chk_inventory_min_quantity_non_negative CHECK (min_quantity_alert >= 0),
  CONSTRAINT chk_inventory_reserved_not_greater_than_available CHECK (quantity_reserved <= quantity_available),
  CONSTRAINT fk_inventory_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_slot_machine
    FOREIGN KEY (machine_id, slot_id) REFERENCES slots(machine_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  machine_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'WALLET',
  total_cents INT NOT NULL,
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_user_id (user_id),
  KEY idx_sales_machine_id (machine_id),
  KEY idx_sales_status (status),
  KEY idx_sales_created_at (created_at),
  CONSTRAINT chk_sales_status CHECK (status IN ('CREATED', 'AUTHORIZED', 'DISPENSING', 'DISPENSED', 'FAILED', 'REFUNDED')),
  CONSTRAINT chk_sales_payment_method CHECK (payment_method IN ('WALLET')),
  CONSTRAINT chk_sales_total_non_negative CHECK (total_cents >= 0),
  CONSTRAINT fk_sales_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_sales_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sale_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  slot_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price_cents INT NOT NULL,
  total_cents INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sale_items_sale_id (sale_id),
  KEY idx_sale_items_product_id (product_id),
  KEY idx_sale_items_slot_id (slot_id),
  CONSTRAINT chk_sale_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_sale_items_unit_price_non_negative CHECK (unit_price_cents >= 0),
  CONSTRAINT chk_sale_items_total_non_negative CHECK (total_cents >= 0),
  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_sale_items_slot
    FOREIGN KEY (slot_id) REFERENCES slots(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(30) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'MOCK',
  provider_payment_id VARCHAR(120) NULL,
  amount_cents INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  mock_qr_code TEXT NULL,
  mock_copy_paste TEXT NULL,
  expires_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payments_provider_payment_id (provider_payment_id),
  KEY idx_payments_user_id (user_id),
  KEY idx_payments_status (status),
  CONSTRAINT chk_payments_type CHECK (type IN ('MOCK_TOPUP')),
  CONSTRAINT chk_payments_provider CHECK (provider IN ('MOCK', 'CHECKOUT_PROVIDER')),
  CONSTRAINT chk_payments_status CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELED')),
  CONSTRAINT chk_payments_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT fk_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallet_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NULL,
  payment_id BIGINT UNSIGNED NULL,
  type VARCHAR(30) NOT NULL,
  amount_cents INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallet_transactions_wallet_id (wallet_id),
  KEY idx_wallet_transactions_user_id (user_id),
  KEY idx_wallet_transactions_sale_id (sale_id),
  KEY idx_wallet_transactions_payment_id (payment_id),
  KEY idx_wallet_transactions_created_at (created_at),
  CONSTRAINT chk_wallet_transactions_type CHECK (type IN ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT')),
  CONSTRAINT chk_wallet_transactions_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED')),
  CONSTRAINT chk_wallet_transactions_reference_type CHECK (reference_type IS NULL OR reference_type IN ('MOCK_TOPUP', 'SALE', 'REFUND', 'MANUAL_ADJUSTMENT')),
  CONSTRAINT chk_wallet_transactions_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT fk_wallet_transactions_wallet
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_transactions_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_transactions_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispense_commands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  command_uuid CHAR(36) NULL,
  sale_id BIGINT UNSIGNED NOT NULL,
  machine_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  slot_id BIGINT UNSIGNED NOT NULL,
  motor_id INT NOT NULL,
  sensor_column_id INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  mqtt_topic VARCHAR(255) NULL,
  payload_json JSON NULL,
  attempts_allowed INT NOT NULL DEFAULT 2,
  attempts_reported INT NOT NULL DEFAULT 0,
  last_error VARCHAR(255) NULL,
  published_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dispense_commands_command_uuid (command_uuid),
  KEY idx_dispense_commands_sale_id (sale_id),
  KEY idx_dispense_commands_machine_id (machine_id),
  KEY idx_dispense_commands_slot_id (slot_id),
  KEY idx_dispense_commands_status (status),
  CONSTRAINT chk_dispense_commands_status CHECK (status IN ('PENDING', 'PUBLISHED', 'ACKED', 'SUCCESS', 'FAILED', 'EXPIRED')),
  CONSTRAINT chk_dispense_commands_motor_positive CHECK (motor_id > 0),
  CONSTRAINT chk_dispense_commands_sensor_positive CHECK (sensor_column_id > 0),
  CONSTRAINT chk_dispense_commands_attempts_allowed_positive CHECK (attempts_allowed > 0),
  CONSTRAINT chk_dispense_commands_attempts_reported_non_negative CHECK (attempts_reported >= 0),
  CONSTRAINT fk_dispense_commands_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dispense_commands_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dispense_commands_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dispense_commands_slot
    FOREIGN KEY (slot_id) REFERENCES slots(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE machine_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NULL,
  dispense_command_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(50) NOT NULL,
  payload_json JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_machine_events_machine_id (machine_id),
  KEY idx_machine_events_sale_id (sale_id),
  KEY idx_machine_events_command_id (dispense_command_id),
  KEY idx_machine_events_event_type (event_type),
  KEY idx_machine_events_occurred_at (occurred_at),
  CONSTRAINT chk_machine_events_event_type CHECK (event_type IN (
    'HEARTBEAT',
    'DISPENSE_STARTED',
    'SENSOR_TRIGGERED',
    'DISPENSE_RETRY',
    'DISPENSE_SUCCESS',
    'DISPENSE_FAILED',
    'MOTOR_ERROR',
    'MACHINE_ERROR'
  )),
  CONSTRAINT fk_machine_events_machine
    FOREIGN KEY (machine_id) REFERENCES machines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_machine_events_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_machine_events_command
    FOREIGN KEY (dispense_command_id) REFERENCES dispense_commands(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
