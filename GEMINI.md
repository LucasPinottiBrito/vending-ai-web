# GEMINI.md

## Role

You are a senior full-stack engineering agent helping develop the Vending Machine Web Platform. Your job is to implement the project according to the academic full stack assignment requirements and the project specification. Prioritize correctness, simplicity, demonstrability, and strict adherence to architecture.

This is not a generic SaaS. It is an academic web platform for a Vending Machine IoT project. The platform must satisfy mandatory assignment requirements while preserving a clean path for ESP32-S3/MQTT integration.

---

## Primary Constraint

Follow the assignment requirements strictly:

```txt
Backend: Node.js + Express
Frontend: React/Next.js + TailwindCSS + RadixUI + shadcnUI
Main database: MySQL
Logs database: MongoDB
Architecture: MVC + Service Layer + Router + Middleware
Authentication: JWT
Mandatory interfaces: IDAO, IService, IController
```

Do not use FastAPI, PostgreSQL, Supabase, Firebase, Prisma-only architectures, NestJS, or any architecture that hides the required MVC/Service/Router/Middleware structure. Do not store business data in MongoDB. MongoDB is for logs only.

---

## Project Summary

The platform manages a vending machine. Users scan a QR Code, view products available in a machine, log in, recharge wallet balance in mock mode, buy one product using internal balance, and track the purchase status. Admins manage machines, slots, products, inventory, users, sales, logs, reports, charts, and imports/exports.

The backend is the source of truth for all business rules. The frontend only displays data and sends user intentions. The ESP32-S3 only executes physical commands and publishes events.

---

## Mandatory Academic Features

Every implementation must keep these features functional and demonstrable:

- Login with JWT.
- Navigation between screens, including menu and breadcrumbs.
- CRUD complete for at least one principal entity; in this project implement CRUDs for products, machines, slots, inventory, and users.
- Search and filters.
- Frontend validation and backend validation.
- PDF report download.
- JSON import and export.
- XML export of MongoDB logs.
- Frontend chart with Chart.js.
- Product image upload and display.
- MySQL persistence for all core entities.
- MongoDB persistence for all logs.
- Authentication middleware.
- Logging middleware.
- Global error handling middleware.

---

## Required Repository Structure

Use the following structure. Do not invent a different architecture unless explicitly instructed by the user.

```txt
/
  backend/
    src/
      app.js
      server.js
      config/
      interfaces/
      models/
      dao/
      services/
      controllers/
      routes/
      middlewares/
      validators/
      utils/
      uploads/products/
    Dockerfile
    package.json
    .env.example

  frontend/
    app/
    components/
    lib/
    hooks/
    public/
    Dockerfile
    package.json
    .env.example

  database/
    mysql/
      schema.sql
      seed.sql
    der/
      der.png

  firmware/
    README.md

  docs/
    especificacao-plataforma-web.md
    documentacao-plataforma-web.pdf
    diagrams/

  docker-compose.yml
  README.md
  AGENTS.md
  GEMINI.md
```

Avoid empty files and placeholder-only modules. Every created file must be useful.

---

## Docker Rules

The application must run using Docker Compose with four core services:

```txt
backend
frontend
mysql
mongodb
```

The MQTT broker is external HiveMQ and should not be part of Docker unless explicitly requested.

Backend must use Docker hostnames:

```txt
MYSQL_HOST=mysql
MONGO_URI=mongodb://mongodb:27017/vending_logs
```

Keep uploaded product images persistent through a mounted volume or bind mount:

```txt
backend/src/uploads/products
```

---

## Backend Architecture

### Controllers

Controllers must:

- receive `req`, `res`, `next`;
- read validated input;
- call services;
- return standardized responses;
- not contain business rules;
- not run SQL directly.

### Services

Services must contain business rules:

- authentication;
- wallet balance;
- stock validation;
- stock reservation;
- checkout;
- sale status transitions;
- refund;
- import/export validation;
- report data preparation;
- chart data preparation;
- MQTT command creation/publishing.

### DAOs

DAOs must handle persistence:

- MySQL queries for business data;
- MongoDB operations for logs;
- no HTTP logic;
- no request/response objects.

### Routes

Routes must be grouped by resource. They must use route parameters and HTTP verbs properly.

Examples:

```txt
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
```

### Middlewares

Implement and use:

- `auth_middleware`: validates JWT and sets `req.user`.
- `log_middleware`: records request/response metadata in MongoDB.
- `error_middleware`: returns standardized error JSON.
- `validation_middleware`: validates body, params, query, and file uploads.

---

## Mandatory Interfaces

Implement these in `backend/src/interfaces/`.

### `IDAO`

Required methods:

```js
create(data)
findById(id)
findAll(filters)
update(id, data)
delete(id)
```

### `IService`

Required methods:

```js
create(data, context)
getById(id, context)
list(filters, context)
update(id, data, context)
delete(id, context)
```

### `IController`

Required methods:

```js
create(req, res, next)
getById(req, res, next)
list(req, res, next)
update(req, res, next)
delete(req, res, next)
```

Use JavaScript classes that throw errors for unimplemented methods. Every DAO, Service, and Controller must clearly extend or conform to these contracts. This is important for the academic video explanation of OOP, interfaces, inheritance, and polymorphism.

---

## MySQL Model

All core entities must be persisted in MySQL.

Required tables:

```txt
users
wallets
wallet_transactions
machines
slots
products
inventory
payments
sales
sale_items
dispense_commands
machine_events
```

Minimum relationship requirements:

- `users` 1:N `sales`.
- `machines` 1:N `slots`.
- `products` 1:N `inventory`.
- `sales` N:N `products` through `sale_items`.

Use explicit foreign keys. Use `ON DELETE` and `ON UPDATE` rules intentionally. Prefer `RESTRICT` when deletion would corrupt history, and use soft delete (`is_active`) where appropriate.

Store money as integer cents.

Do not use floating point for money.

---

## MongoDB Logs

MongoDB must store all logs in a `logs` collection.

Log these events:

- login success;
- login failure;
- logout;
- access to routes;
- record creation;
- record update with before/after;
- record deletion with deleted data;
- errors and exceptions with stack trace;
- JSON imports/exports;
- XML exports;
- PDF report generation.

`log_middleware` must capture:

```txt
endpoint
method
user
timestamp
IP
status_code
response_time_ms
user_agent
```

Do not store passwords, full JWTs, or secrets in logs.

---

## Business Domain Rules

### Users and Wallets

- Every user must have a wallet.
- Wallet balance must never be negative.
- Wallet transactions must be recorded for every credit, debit, refund, and adjustment.
- Admin manual changes must be logged.

### Products

- Products require name, price, active status, and optionally description/category/image.
- Product price must always come from the backend/MySQL.
- Frontend-provided price is not trusted.
- Product image upload must be functional.

### Machines and Slots

- Machine has `id`, `slug`, `name`, `location`, `status`, `last_seen_at`, `is_active`.
- `slug` is for QR Code URLs.
- `id` is for MQTT topics.
- Slot belongs to a machine.
- Slot contains physical configuration: `code`, `motor_id`, `sensor_column_id`, `is_enabled`.

### Inventory

- Inventory belongs to a slot.
- One slot holds one product type in the MVP.
- Available stock is `quantity_available - quantity_reserved`.
- Do not allow negative stock.
- Do not allow reservation greater than available stock.

### Sales

MVP rule: one sale, one product, one slot, one command.

Still use `sale_items` to satisfy the N:N requirement and support future multi-item purchases.

Sale statuses:

```txt
CREATED
AUTHORIZED
DISPENSING
DISPENSED
FAILED
REFUNDED
```

### Checkout Flow

When user buys with wallet:

1. Validate authenticated user.
2. Validate active user.
3. Validate machine exists and is online.
4. Validate product is active.
5. Validate slot is enabled and belongs to machine.
6. Validate inventory belongs to slot and product.
7. Validate available stock.
8. Validate sufficient wallet balance.
9. Debit wallet.
10. Create wallet transaction.
11. Reserve stock.
12. Create sale.
13. Create sale item.
14. Create dispense command.
15. Publish MQTT command or mark it pending for publication.
16. Log the operation.

Use a MySQL transaction for critical operations.

### Failure and Refund

If ESP32-S3 or simulator reports failure:

- mark command as `FAILED`;
- mark sale as `FAILED`;
- release reserved stock;
- refund wallet;
- create refund wallet transaction;
- mark sale as `REFUNDED`;
- log the operation.

Events must be idempotent. Do not refund twice.

---

## MQTT Rules

MQTT is complementary to the web platform but must be cleanly integrated.

Broker:

```txt
HiveMQ public broker
```

Topics:

```txt
vending/{machine_id}/actions
vending/{machine_id}/events
vending/{machine_id}/status
```

Command payload must include:

```txt
type
command_id
sale_id
machine_id
product_id
slot_id
slot_code
motor_id
sensor_column_id
quantity
attempts_allowed
timeout_ms_per_attempt
issued_at
expires_at
```

Expected events:

```txt
HEARTBEAT
DISPENSE_STARTED
SENSOR_TRIGGERED
DISPENSE_RETRY
DISPENSE_SUCCESS
DISPENSE_FAILED
MOTOR_ERROR
MACHINE_ERROR
```

Heartbeat every 30 seconds. Mark offline after two missing periods, with practical tolerance around 65–75 seconds.

If MQTT implementation is not finished in an early development phase, create clean service boundaries and a mock/simulator path. Do not hardcode IoT logic inside controllers.

---

## Required Endpoints

Implement endpoints with `/api` prefix.

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Public Catalog

```txt
GET /api/machines/:slug/catalog
GET /api/machines/:slug/status
```

### User

```txt
GET  /api/users/me
PATCH /api/users/me
GET  /api/wallet/balance
GET  /api/wallet/transactions
POST /api/wallet/topup/mock
GET  /api/sales
GET  /api/sales/:id
POST /api/sales/checkout
```

### Admin

Implement CRUDs for:

```txt
machines
slots
products
inventory
users
```

Also implement:

```txt
GET  /api/admin/logs
GET  /api/admin/logs/export/xml
GET  /api/admin/export/json?entity=products
GET  /api/admin/export/json?entity=inventory
POST /api/admin/import/json?entity=products
POST /api/admin/import/json?entity=inventory
GET  /api/admin/reports/sales
GET  /api/admin/charts/sales-by-month
GET  /api/admin/machines/:machineId/events
POST /api/admin/products/:id/image
```

---

## Frontend Rules

Use Next.js/React, but keep the project explainable as HTML5, CSS3, and JavaScript with a framework.

Customer pages:

```txt
/
/login
/register
/m/[machineSlug]
/m/[machineSlug]/product/[productId]
/m/[machineSlug]/checkout/[slotId]
/purchase/[saleId]
/account
/account/wallet
/account/purchases
```

Admin pages:

```txt
/admin
/admin/machines
/admin/products
/admin/inventory
/admin/users
/admin/sales
/admin/logs
/admin/import-export
/admin/reports
/admin/charts
/admin/events
```

Frontend must include:

- navigation menu;
- breadcrumbs;
- login/register forms;
- validation feedback;
- catalog display;
- product image display;
- admin CRUD screens;
- search/filter fields;
- file upload input for product images;
- file upload input for JSON imports;
- JSON export buttons;
- XML log export button;
- PDF report generation/download;
- Chart.js monthly sales chart;
- toast/alerts for success/failure.

---

## Import / Export and Reporting

### JSON Import/Export

Entities:

```txt
products
inventory
```

Export must download readable JSON.

Import must validate the uploaded file before inserting or updating MySQL records. Invalid structure must return a controlled error and show feedback to the user.

### XML Logs

Export logs from MongoDB as XML. Support optional filters:

```txt
user_id
start_date
end_date
```

### PDF Report

Report: sales by period and history.

Must include:

- title;
- generation date/time;
- user who generated it;
- filters;
- sales table;
- totals/statistics;
- professional formatting.

### Chart

Chart: monthly sales.

Use Chart.js. Data must come from backend endpoint backed by MySQL.

---

## Development Order

Implement in this order:

1. Docker Compose with backend, frontend, MySQL, MongoDB.
2. MySQL schema and seed.
3. Backend base: Express, config, error middleware, response utils.
4. Interfaces: `IDAO`, `IService`, `IController`.
5. MySQL connection and MongoDB connection.
6. Auth: register, login, JWT, bcrypt, auth middleware.
7. Log middleware and LogService/LogDAO.
8. Product CRUD with image upload.
9. Machine CRUD.
10. Slot CRUD.
11. Inventory CRUD.
12. Wallet and mock top-up.
13. Checkout with stock reservation.
14. Sales and history.
15. MQTT service and event handling boundaries.
16. JSON import/export for products and inventory.
17. XML export of logs.
18. Report endpoint and PDF generation in frontend.
19. Chart endpoint and Chart.js frontend.
20. Admin UI polish.
21. Documentation and README.
22. Demo preparation.

Do not start with UI polish before core requirements are functional.

---

## Code Quality Rules

- Keep code simple.
- Prefer explicit files and names.
- Avoid magic strings; use constants where useful.
- Keep controllers small.
- Keep services responsible for business rules.
- Keep DAOs responsible for persistence.
- Use prepared statements or a safe query layer.
- Validate all external input.
- Use transactions for wallet/stock/sale flows.
- Return standardized JSON.
- Log relevant operations.
- Never log passwords or tokens.
- Do not bypass middleware.
- Do not create fake screens that are not wired to backend.
- Do not leave TODOs for mandatory features.

---

## Definition of Done

The project is acceptable when all of this works:

- `docker-compose up --build` starts all four services.
- MySQL initializes with schema and seed data.
- MongoDB stores request and action logs.
- User can register and login.
- JWT protects private routes.
- Admin routes require admin role.
- Product CRUD works.
- Product image upload and display work.
- Machine CRUD works.
- Slot CRUD works.
- Inventory CRUD works.
- User can view catalog by machine slug.
- User can view balance.
- User can recharge wallet in mock mode.
- User can buy one product with wallet balance.
- Stock reservation works.
- Sale status updates work.
- Failed dispense flow can refund.
- Products can be imported/exported as JSON.
- Inventory can be imported/exported as JSON.
- Logs can be exported as XML.
- Sales PDF report can be generated/downloaded.
- Monthly sales Chart.js chart works.
- Search and filters exist.
- Middlewares are demonstrable.
- Interfaces are demonstrable.
- README and documentation explain setup and architecture.

---

## What Not To Do

Do not:

- use FastAPI;
- use Supabase as the main database;
- use PostgreSQL;
- store main entities in MongoDB;
- remove MySQL or MongoDB from Docker;
- skip interfaces because JavaScript does not enforce them;
- put SQL directly in controllers;
- put business rules in routes;
- implement only visual screens without backend integration;
- ignore XML/PDF/JSON/chart/image requirements;
- replace JWT with Google login for the academic MVP;
- make MQTT mandatory to run the web demo;
- modify firmware unless asked.

When uncertain, preserve the academic requirements first, then the IoT/TCC extension.
