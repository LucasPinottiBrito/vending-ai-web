# AGENTS.md

## Project: Vending Machine Web Platform

This repository contains the web platform for an academic full stack application and an IoT vending machine project. The platform must satisfy the requirements of the "Desenvolvimento de Aplicação Web Full Stack" assignment while preserving compatibility with the broader TCC project of an intelligent vending machine using ESP32-S3 and MQTT.

The primary goal is to build a complete full stack web application with Node.js + Express, Next.js/React, MySQL, MongoDB logs, JWT authentication, Docker, and a clean MVC + Service Layer + Router + Middleware architecture.

The IoT module is complementary. MQTT and ESP32-S3 integration must be supported by the backend, but firmware development lives in a separate folder and must not compromise the mandatory web application requirements.

---

## Non-Negotiable Academic Requirements

The project must strictly follow these rules:

- Backend: Node.js + Express.
- Frontend: HTML5, CSS3, JavaScript with React/Next.js.
- Main relational database: MySQL.
- NoSQL database: MongoDB only for logs.
- Architecture: MVC + Service Layer + Router + Middleware.
- Authentication: local JWT implemented in the backend.
- Mandatory interfaces: `IDAO`, `IService`, and `IController`.
- Required middlewares: `auth_middleware`, `log_middleware`, `error_middleware`, and `validation_middleware`.
- Required JSON import/export for `products` and `inventory`.
- Required XML export of MongoDB logs.
- Required PDF report: sales by period and purchase history.
- Required frontend chart: monthly sales using Chart.js.
- Required upload and display of product images.
- Required MySQL script with CREATE TABLE and INSERT seed data.
- Required MySQL DER diagram.
- Required documentation PDF and demo video.

Do not replace MySQL with PostgreSQL, Supabase, SQLite, Firebase, or any other database. Do not replace MongoDB logs with file logs or MySQL logs. Do not replace Express with FastAPI, NestJS, Flask, or other frameworks unless the user explicitly changes the project again.

---

## Core Product Scope

The platform manages a vending machine operation. The final application must support two roles:

### End User

The end user must be able to:

- Access a vending machine page through a QR Code URL.
- View the catalog of products available in a machine.
- Register using email and password.
- Log in using JWT authentication.
- View wallet balance.
- Recharge wallet balance using mocked payment mode.
- Buy one product at a time using internal wallet balance.
- Track the purchase status.
- View purchase history.
- Open a WhatsApp support link to report a problem.

### Administrator

The administrator must be able to:

- Manage machines.
- Manage slots linked to machines.
- Manage products.
- Upload and display product images.
- Manage inventory by slot.
- Manage users.
- View sales.
- View payments/top-ups.
- View machine events.
- View system logs stored in MongoDB.
- Export logs to XML.
- Import/export products and inventory as JSON.
- Generate a PDF report for sales by period and history.
- View a Chart.js chart of monthly sales.
- Use search and filters in administrative screens.

### ESP32-S3 / IoT Integration

The backend must be prepared to integrate with an ESP32-S3 vending machine through MQTT. The backend publishes dispense commands and receives status/events. The firmware is not part of the core web delivery but must remain compatible with the backend contract.

MQTT topics:

```txt
vending/{machine_id}/actions
vending/{machine_id}/events
vending/{machine_id}/status
```

Backend publishes `actions`. ESP32-S3 consumes `actions`. ESP32-S3 publishes `events` and `status`. Backend consumes `events` and `status`.

---

## Required Repository Structure

Use this structure unless the user explicitly requests otherwise:

```txt
/
  backend/
    src/
      app.js
      server.js
      config/
        env.js
        mysql.js
        mongodb.js
        mqtt.js
      interfaces/
        IDAO.js
        IService.js
        IController.js
      models/
        UserModel.js
        WalletModel.js
        WalletTransactionModel.js
        MachineModel.js
        SlotModel.js
        ProductModel.js
        InventoryModel.js
        PaymentModel.js
        SaleModel.js
        SaleItemModel.js
        DispenseCommandModel.js
        MachineEventModel.js
      dao/
        UserDAO.js
        WalletDAO.js
        WalletTransactionDAO.js
        MachineDAO.js
        SlotDAO.js
        ProductDAO.js
        InventoryDAO.js
        PaymentDAO.js
        SaleDAO.js
        SaleItemDAO.js
        DispenseCommandDAO.js
        MachineEventDAO.js
        LogDAO.js
      services/
        AuthService.js
        WalletService.js
        MachineService.js
        SlotService.js
        ProductService.js
        InventoryService.js
        PaymentService.js
        SaleService.js
        DispenseCommandService.js
        MachineEventService.js
        MqttService.js
        LogService.js
        ImportExportService.js
        ReportService.js
        ChartService.js
      controllers/
        AuthController.js
        UserController.js
        WalletController.js
        MachineController.js
        SlotController.js
        ProductController.js
        InventoryController.js
        PaymentController.js
        SaleController.js
        MachineEventController.js
        LogController.js
        ImportExportController.js
        ReportController.js
        ChartController.js
      routes/
        AuthRoutes.js
        UserRoutes.js
        WalletRoutes.js
        MachineRoutes.js
        SlotRoutes.js
        ProductRoutes.js
        InventoryRoutes.js
        PaymentRoutes.js
        SaleRoutes.js
        MachineEventRoutes.js
        LogRoutes.js
        ImportExportRoutes.js
        ReportRoutes.js
        ChartRoutes.js
      middlewares/
        auth_middleware.js
        log_middleware.js
        error_middleware.js
        validation_middleware.js
      validators/
        authValidator.js
        userValidator.js
        machineValidator.js
        slotValidator.js
        productValidator.js
        inventoryValidator.js
        saleValidator.js
        paymentValidator.js
        reportValidator.js
      utils/
        ApiError.js
        response.js
        jwt.js
        password.js
        fileUpload.js
        xml.js
        date.js
        money.js
      uploads/
        products/
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

Do not create decorative folders or empty placeholders. Every file must have a clear purpose.

---

## Docker Architecture

Use Docker Compose with four primary services:

```txt
backend
frontend
mysql
mongodb
```

HiveMQ is external and must not be added as a Docker service unless the user explicitly requests a local broker.

Expected ports:

```txt
frontend: 3000
backend: 4000
mysql: 3306
mongodb: 27017
```

Required volumes:

```txt
mysql_data
mongo_data
backend uploads folder for product images
```

The backend must connect to MySQL using the Docker service hostname `mysql` and to MongoDB using `mongodb`.

---

## Backend Architecture Rules

The backend must use Node.js + Express with JavaScript. Keep the architecture explicit and demonstrable for the academic evaluation.

### MVC

- Model: database structure and data representation.
- View: frontend application, not Express templates.
- Controller: receives HTTP requests, calls services, returns responses.

### Service Layer

Business rules must live in services. Controllers must not contain business logic beyond request orchestration.

### DAO Layer

DAOs are responsible for persistence and SQL/Mongo operations. Services call DAOs. Controllers do not call DAOs directly.

### Routes

Routes must be grouped by resource and implemented as route classes or class-like modules. Each route group must support the necessary HTTP verbs: GET, POST, PUT/PATCH, DELETE.

### Middlewares

Implement these mandatory middlewares:

- `auth_middleware`: validates JWT and protects private routes.
- `log_middleware`: records each request in MongoDB with endpoint, method, user, timestamp, IP, status code, and response time.
- `error_middleware`: handles global exceptions and returns standardized JSON responses.
- `validation_middleware`: validates request body, params, query, and files before reaching controllers.

---

## Mandatory Interfaces

Because JavaScript does not enforce interfaces natively, implement mandatory interfaces as base classes that throw an error when a method is not implemented. Alternatively, use documented contract classes, but every DAO, Service, and Controller must clearly implement the required contract.

### `IDAO`

Must define at least:

```js
create(data)
findById(id)
findAll(filters)
update(id, data)
delete(id)
```

### `IService`

Must define at least:

```js
create(data, context)
getById(id, context)
list(filters, context)
update(id, data, context)
delete(id, context)
```

### `IController`

Must define at least:

```js
create(req, res, next)
getById(req, res, next)
list(req, res, next)
update(req, res, next)
delete(req, res, next)
```

If some controller does not need all methods, implement the method and return a controlled `501 Not Implemented` response, but do not leave it missing.

---

## Database Rules: MySQL

MySQL is the source of truth for all main business data.

Required characteristics:

- At least 5 related tables.
- Primary keys on all tables.
- Foreign keys where applicable.
- Referential integrity with `ON DELETE` / `ON UPDATE` rules.
- At least one 1:N relationship.
- At least one N:N relationship using an intermediate table.

Use `sale_items` as the N:N join table between `sales` and `products`, even though MVP sales contain only one product. This satisfies the academic requirement and keeps the system extensible.

### Required MySQL Tables

Implement at least:

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

### Key Relationships

- `users` 1:1 `wallets`.
- `users` 1:N `sales`.
- `machines` 1:N `slots`.
- `slots` 1:1 or 1:N `inventory`.
- `products` 1:N `inventory`.
- `sales` N:N `products` through `sale_items`.
- `sales` 1:N `dispense_commands`.
- `machines` 1:N `machine_events`.

### Money

Store all monetary values as integer cents, never floating point.

Examples:

```txt
price_cents
balance_cents
amount_cents
total_cents
```

---

## MongoDB Logging Rules

MongoDB is only for logs. Do not store core business entities in MongoDB.

Use a collection named:

```txt
logs
```

Each log should include fields such as:

```json
{
  "timestamp": "2026-06-08T12:00:00.000Z",
  "event_type": "REQUEST_ACCESS",
  "action": "GET /api/products",
  "user_id": 1,
  "user_email": "admin@example.com",
  "ip": "127.0.0.1",
  "user_agent": "Mozilla/5.0",
  "endpoint": "/api/products",
  "method": "GET",
  "status_code": 200,
  "response_time_ms": 30,
  "table_name": null,
  "record_id": null,
  "before": null,
  "after": null,
  "details": {}
}
```

Mandatory log types:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `LOGOUT`
- `REQUEST_ACCESS`
- `CREATE`
- `UPDATE`
- `DELETE`
- `ERROR`
- `IMPORT_JSON`
- `EXPORT_JSON`
- `EXPORT_XML`
- `GENERATE_PDF_REPORT`

Every relevant CRUD operation must register a MongoDB log. Errors and exceptions must include stack traces, endpoint, method, user, and timestamp.

---

## Authentication and Authorization

Use local JWT authentication in the backend.

Required auth routes:

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Rules:

- Passwords must be hashed using bcrypt.
- JWT secret must come from environment variables.
- JWT expiration must be configurable.
- Public routes: login, register, recovery if implemented, public machine catalog.
- Private routes: wallet, checkout, history, admin.
- Admin routes must verify `role = ADMIN`.

User roles:

```txt
USER
ADMIN
OPERATOR
```

For the academic MVP, `USER` and `ADMIN` are sufficient, but keep `OPERATOR` if useful.

---

## Business Rules

### Backend as Source of Truth

The backend is the source of truth for:

- user authentication and authorization;
- product price;
- stock availability;
- wallet balance;
- sale authorization;
- stock reservation;
- refund;
- command creation;
- MQTT publishing;
- sale status;
- reporting and logs.

The frontend never decides final price, stock, balance, or purchase authorization.

The ESP32-S3 never decides payment, balance, price, stock, or sale authorization. It only executes physical commands and publishes events/status.

### Purchase Rules

- User must be authenticated and active.
- Machine must exist and be active.
- Machine must be online to sell.
- Product must be active.
- Slot must belong to the machine and be enabled.
- Inventory must belong to the selected slot.
- Product in inventory must match the purchased product.
- Available stock is `quantity_available - quantity_reserved`.
- Available stock must be greater than zero.
- Wallet balance must be sufficient.
- The purchase is one product per sale in the MVP.
- The backend must create sale, sale item, wallet transaction, inventory reservation, and dispense command consistently.

### Stock Reservation Rules

On purchase authorization:

- increment `quantity_reserved`;
- debit wallet;
- create wallet transaction;
- create sale;
- create sale item;
- create dispense command.

On dispense success:

- decrement `quantity_available`;
- decrement `quantity_reserved`;
- mark sale as `DISPENSED`;
- mark command as `SUCCESS`.

On dispense failure:

- decrement `quantity_reserved`;
- refund wallet;
- create refund wallet transaction;
- mark sale as `FAILED` then `REFUNDED`;
- mark command as `FAILED` or `EXPIRED`.

### Sale Statuses

```txt
CREATED
AUTHORIZED
DISPENSING
DISPENSED
FAILED
REFUNDED
```

Success flow:

```txt
CREATED -> AUTHORIZED -> DISPENSING -> DISPENSED
```

Failure flow:

```txt
CREATED -> AUTHORIZED -> DISPENSING -> FAILED -> REFUNDED
```

### Dispense Command Statuses

```txt
PENDING
PUBLISHED
ACKED
SUCCESS
FAILED
EXPIRED
```

`ACKED` is reserved for future use. The MVP does not require the ESP32-S3 to publish a dedicated ACK event.

---

## MQTT Integration Rules

The MQTT integration is part of the TCC extension and backend capability. It must not remove or weaken the academic web requirements.

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

### Command: `DISPENSE`

Backend publishes to:

```txt
vending/{machine_id}/actions
```

Payload example:

```json
{
  "type": "DISPENSE",
  "command_id": "uuid-or-id",
  "sale_id": "uuid-or-id",
  "machine_id": "machine-id",
  "product_id": "product-id",
  "slot_id": "slot-id",
  "slot_code": "A1",
  "motor_id": 1,
  "sensor_column_id": 1,
  "quantity": 1,
  "attempts_allowed": 2,
  "timeout_ms_per_attempt": 10000,
  "issued_at": "2026-06-08T12:00:00Z",
  "expires_at": "2026-06-08T12:01:00Z"
}
```

### Status: `HEARTBEAT`

ESP32-S3 publishes to:

```txt
vending/{machine_id}/status
```

Every 30 seconds.

If the backend does not receive heartbeat for two periods, the machine is considered offline. For practical tolerance, use approximately 65 to 75 seconds.

### Events

ESP32-S3 publishes to:

```txt
vending/{machine_id}/events
```

Expected event types:

```txt
DISPENSE_STARTED
SENSOR_TRIGGERED
DISPENSE_RETRY
DISPENSE_SUCCESS
DISPENSE_FAILED
MOTOR_ERROR
MACHINE_ERROR
```

---

## Required Backend Endpoints

Use `/api` prefix. Protect all private and admin routes.

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Public Machine Catalog

```txt
GET /api/machines/:slug/catalog
GET /api/machines/:slug/status
```

### User / Wallet / Sales

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

### Admin Machines

```txt
GET    /api/admin/machines
POST   /api/admin/machines
GET    /api/admin/machines/:id
PUT    /api/admin/machines/:id
DELETE /api/admin/machines/:id
```

### Admin Slots

```txt
GET    /api/admin/machines/:machineId/slots
POST   /api/admin/machines/:machineId/slots
GET    /api/admin/slots/:id
PUT    /api/admin/slots/:id
DELETE /api/admin/slots/:id
```

### Admin Products

```txt
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/image
```

### Admin Inventory

```txt
GET    /api/admin/inventory
GET    /api/admin/machines/:machineId/inventory
POST   /api/admin/inventory
GET    /api/admin/inventory/:id
PUT    /api/admin/inventory/:id
DELETE /api/admin/inventory/:id
POST   /api/admin/inventory/:id/adjust
```

### Import / Export JSON

```txt
GET  /api/admin/export/json?entity=products
GET  /api/admin/export/json?entity=inventory
POST /api/admin/import/json?entity=products
POST /api/admin/import/json?entity=inventory
```

### Logs / XML

```txt
GET /api/admin/logs
GET /api/admin/logs/export/xml?user_id=&start_date=&end_date=
```

### Reports / Charts

```txt
GET /api/admin/reports/sales?start_date=&end_date=&machine_id=&status=
GET /api/admin/charts/sales-by-month?year=
```

### Machine Events

```txt
GET /api/admin/machines/:machineId/events
```

---

## Frontend Requirements

Frontend must use Next.js/React while still satisfying HTML5, CSS3, and JavaScript requirements.

### Required Pages

Public/customer:

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
/account/purchases/[saleId]
```

Admin:

```txt
/admin
/admin/machines
/admin/machines/[id]
/admin/machines/[id]/slots
/admin/machines/[id]/inventory
/admin/products
/admin/inventory
/admin/users
/admin/sales
/admin/payments
/admin/events
/admin/logs
/admin/import-export
/admin/reports
/admin/charts
```

### Required UX

- Mobile-first customer flow.
- Clear catalog by machine.
- Product cards with image, price, and availability.
- Login/register forms.
- Wallet balance display.
- Mock top-up flow.
- Checkout with disabled button on loading.
- Purchase status screen.
- Admin dashboard.
- Navigation menu, links, and breadcrumbs.
- Search and filters.
- Toast or clear feedback messages.
- Validation feedback on forms.

### Chart.js

Use Chart.js for the monthly sales chart. Data must come from backend/MySQL through API.

### PDF Report

Use a frontend PDF library such as `jsPDF` or `pdfmake`, or backend PDF generation if simpler. The report must include:

- title;
- generation date/time;
- name of user who generated it;
- filters used;
- table of sales;
- totals/statistics;
- professional formatting with header/footer.

### Image Upload

Product images must be uploaded through the admin interface. Use local backend storage under:

```txt
backend/src/uploads/products
```

The backend must expose static files safely so the frontend can display uploaded images.

---

## Import / Export Rules

### JSON Export

Entities initially supported:

```txt
products
inventory
```

Requirements:

- user selects entity;
- backend exports data from MySQL;
- file is downloaded as `.json`;
- JSON is readable and structured;
- operation is logged in MongoDB.

### JSON Import

Requirements:

- upload through frontend using `input type="file"`;
- validate file extension and MIME when possible;
- parse JSON safely;
- validate structure before insertion;
- reject invalid fields;
- handle duplicates or conflicts predictably;
- show success/failure feedback;
- log operation in MongoDB.

### XML Log Export

Requirements:

- export logs stored in MongoDB;
- allow filter by date and/or user;
- generate XML for download;
- XML must be structured and legible;
- operation must itself be logged.

---

## Testing and Validation

### Backend Tests / Manual Validation

At minimum validate:

- register/login/logout;
- protected route without token;
- admin route with non-admin user;
- CRUD products;
- product image upload;
- CRUD machines;
- CRUD slots;
- CRUD inventory;
- search/filter products;
- checkout with insufficient balance;
- checkout without stock;
- successful wallet checkout;
- stock reservation;
- mocked wallet top-up;
- JSON export products;
- JSON import products;
- JSON export inventory;
- JSON import inventory;
- XML log export;
- PDF report data endpoint;
- Chart.js data endpoint;
- MongoDB request logs;
- MongoDB CRUD logs;
- global error middleware.

### Frontend Validation

At minimum validate:

- login page;
- register page;
- navigation menu;
- breadcrumbs;
- catalog page;
- checkout page;
- wallet page;
- admin CRUD pages;
- import/export UI;
- logs XML export UI;
- PDF report UI;
- monthly sales chart;
- image upload and display;
- validation errors.

---

## Coding Standards

- Prefer simple, readable JavaScript.
- Do not over-engineer.
- Keep controllers thin.
- Keep business logic in services.
- Keep persistence logic in DAOs.
- Keep validation in validators/middleware.
- Use standardized API responses.
- Use centralized error handling.
- Use environment variables for secrets.
- Never log passwords, full JWTs, or sensitive secrets.
- Do not create unused files.
- Do not create non-functional placeholders.
- Do not bypass the required architecture to deliver faster.
- Ensure every mandatory academic requirement is demonstrable.

---

## Environment Variables

Backend `.env.example` must include:

```env
NODE_ENV=development
PORT=4000

MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=vending_machine
MYSQL_USER=vending_user
MYSQL_PASSWORD=vending_pass

MONGO_URI=mongodb://mongodb:27017/vending_logs

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d

UPLOAD_DIR=src/uploads/products
PUBLIC_UPLOAD_BASE_URL=http://localhost:4000/uploads/products

PAYMENT_MODE=mock

MQTT_HOST=broker.hivemq.com
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_USE_TLS=false

FRONTEND_URL=http://localhost:3000
WHATSAPP_SUPPORT_URL=https://wa.me/55XXXXXXXXXXX
```

Frontend `.env.example` must include:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_SUPPORT_URL=https://wa.me/55XXXXXXXXXXX
```

---

## Required Deliverables

The repository must support the final academic deliverables:

- Complete source code.
- GitHub repository link.
- `.zip` package of the project.
- `database/mysql/schema.sql`.
- `database/mysql/seed.sql`.
- MySQL DER diagram image or Workbench/BrModelo file.
- Documentation PDF explaining the project.
- Demo video up to 10 minutes.

Documentation must explain:

- selected theme and objective;
- business rules;
- MVC structure;
- `IDAO`, `IController`, `IService` and implementing classes;
- services and separated business rules;
- MySQL tables and relationships;
- MongoDB logs structure;
- XML log export;
- PDF report;
- Chart.js chart and data source;
- setup and execution steps;
- endpoint/route list.

---

## Definition of Done

The project is ready when:

- `docker-compose up --build` starts frontend, backend, MySQL, and MongoDB.
- MySQL schema and seed are loaded.
- MongoDB stores request logs.
- JWT login works.
- Auth middleware protects private routes.
- Log middleware records requests in MongoDB.
- Error middleware returns standardized JSON.
- Validation middleware blocks invalid payloads.
- CRUD works for products, machines, slots, inventory, and users.
- Product image upload and display work.
- Products and inventory can be imported/exported as JSON.
- MongoDB logs can be exported as XML.
- Sales by period/history PDF report works.
- Monthly sales Chart.js chart works.
- User can buy one product using wallet balance.
- Stock reservation works.
- Failed dispense path can refund wallet.
- Admin can view sales, logs, and events.
- MQTT integration is implemented or at least cleanly prepared with service boundaries.
- README explains how to run the project.
- Documentation and deliverables are prepared.
