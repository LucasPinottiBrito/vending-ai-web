# Backend README

API Express da Vending Machine Web Platform. Esta base segue a arquitetura obrigatoria do projeto academico:

```txt
MVC + Service Layer + Router + Middleware
```

Documentação completa da API: [`../docs/api/index.md`](../docs/api/index.md)

## Como Rodar

Instalar dependencias:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Rodar em modo normal:

```bash
npm start
```

Rodar testes, com MySQL e MongoDB ativos:

```bash
npm test
```

Com Docker, use a raiz do repositorio:

```bash
docker compose up --build
```

## Envs

As variaveis ficam em `.env.example` e podem ser copiadas para `.env`.

Principais variaveis:

- `PORT`: porta HTTP do backend, padrao `4000`.
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`: conexao MySQL.
- `MONGO_URI`: conexao MongoDB, usando o banco `vending_logs`.
- `JWT_SECRET`, `JWT_EXPIRES_IN`: assinatura e expiracao dos tokens JWT.
- `UPLOAD_DIR`: pasta local para imagens de produtos.
- `PUBLIC_UPLOAD_BASE_URL`: URL publica usada para exibir imagens.
- `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_USE_TLS`: broker MQTT externo.
- `FRONTEND_URL`: origem liberada no CORS.

## Arquitetura

Fluxo padrao de uma requisicao:

```txt
HTTP request
  -> route
  -> validation/auth/log middleware
  -> controller
  -> service
  -> DAO
  -> MySQL ou MongoDB
  -> response JSON padronizada
```

Pastas principais:

- `src/config`: env, MySQL, MongoDB e MQTT.
- `src/interfaces`: contratos `IDAO`, `IService`, `IController`.
- `src/models`: estruturas e normalizadores de dados.
- `src/dao`: persistencia MySQL ou MongoDB.
- `src/services`: regras de negocio.
- `src/controllers`: camada HTTP sem regra de negocio.
- `src/routes`: agrupamento de rotas por recurso.
- `src/middlewares`: autenticacao, logs, erros e validacao.
- `src/validators`: schemas Joi reutilizaveis.
- `src/utils`: resposta JSON, JWT, senha, upload, XML e erros.

## Middlewares Obrigatorios

`auth_middleware`:

- valida o header `Authorization: Bearer <token>`;
- verifica o JWT com `JWT_SECRET`;
- consulta o usuario no MySQL;
- bloqueia token ausente, token invalido e usuario inativo;
- adiciona o usuario autenticado e sem `password_hash` em `req.user`.

`log_middleware`:

- registra cada requisicao como `REQUEST_ACCESS` em `vending_logs.logs`;
- salva endpoint, metodo, usuario quando conhecido, timestamp, IP, status code, tempo de resposta e user agent;
- nao grava senha, hash de senha, header `Authorization` ou token JWT completo;
- funciona para rotas publicas e privadas.

`error_middleware`:

- captura erros globais;
- retorna JSON padronizado;
- registra `ERROR` ou `EXCEPTION` no MongoDB;
- salva stack trace no log;
- nao expoe stack trace ao frontend.

`validation_middleware`:

- valida `body`, `params` e `query` com schemas Joi;
- roda antes do controller;
- remove campos desconhecidos;
- retorna erro `400` padronizado com detalhes por campo.

Documentacao completa: [`../docs/api/middlewares.md`](../docs/api/middlewares.md).

## Contratos Obrigatorios

`IDAO` define:

```js
create(data)
findById(id)
findAll(filters)
update(id, data)
delete(id)
```

`IService` define:

```js
create(data, context)
getById(id, context)
list(filters, context)
update(id, data, context)
delete(id, context)
```

`IController` define:

```js
create(req, res, next)
getById(req, res, next)
list(req, res, next)
update(req, res, next)
delete(req, res, next)
```

Como JavaScript nao possui interfaces nativas, esses contratos sao classes base que lancam erro quando um metodo nao foi implementado.

## Criando um Novo Recurso

Exemplo para `Product`:

1. Criar `src/dao/ProductDAO.js` estendendo `IDAO` e concentrando SQL MySQL.
2. Criar `src/services/ProductService.js` estendendo `IService` e colocando regras de negocio.
3. Criar `src/controllers/ProductController.js` estendendo `IController` e usando `sendSuccess`.
4. Criar `src/routes/ProductRoutes.js` como classe que monta `Router`.
5. Criar `src/validators/productValidator.js` com schemas Joi.
6. Registrar as rotas em `src/routes/index.js`.
7. Escrever testes em `tests/` antes da implementacao.

Controllers nao devem executar SQL. Services nao devem conhecer `req` ou `res`. DAOs nao devem conter regra HTTP.

## Endpoints Atuais

- `GET /health`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/image`
- `GET /api/machines`
- `GET /api/machines/:id`
- `GET /api/machines/slug/:slug`
- `GET /api/machines/slug/:slug/catalog`
- `POST /api/machines`
- `PUT /api/machines/:id`
- `DELETE /api/machines/:id`
- `GET /api/machines/:machineId/slots`
- `POST /api/machines/:machineId/slots`
- `PUT /api/slots/:id`
- `DELETE /api/slots/:id`
- `GET /api/inventory`
- `GET /api/machines/:machineId/inventory`
- `GET /api/inventory/:id`
- `POST /api/inventory`
- `PUT /api/inventory/:id`
- `POST /api/inventory/:id/adjust`
- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `POST /api/wallet/topup/mock`
- `GET /api/payments/:id`
- `POST /api/payments/:id/confirm-mock`
- `POST /api/sales/checkout`
- `GET /api/sales`
- `GET /api/sales/:id`
- `GET /api/users/me/purchases`
- `GET /api/admin/export/json?entity=products`
- `GET /api/admin/export/json?entity=inventory`
- `POST /api/admin/import/json?entity=products`
- `POST /api/admin/import/json?entity=inventory`
- `GET /api/admin/logs/export/xml?user=&start_date=&end_date=&event_type=`
- `GET /api/admin/reports/sales?start_date=&end_date=&machine_id=&status=`
- `GET /api/admin/reports/purchase-history?user_id=&start_date=&end_date=`
- `GET /api/admin/charts/sales-by-month?year=`

As rotas de autenticação usam JWT local assinado com `JWT_SECRET`. Registro e login nunca retornam `password_hash`.

## Autenticacao JWT

Rotas publicas:

- `POST /api/auth/register`: cria usuario `USER`, gera hash bcrypt da senha e cria uma wallet com saldo zero.
- `POST /api/auth/login`: valida email/senha, retorna JWT e registra `LOGIN_SUCCESS` ou `LOGIN_FAILURE` no MongoDB.

Rotas privadas:

- `GET /api/auth/me`: exige `Authorization: Bearer <token>` e retorna o usuario autenticado.
- `POST /api/auth/logout`: exige token e registra `LOGOUT` no MongoDB.

Arquivos principais:

- `src/dao/UserDAO.js`: acesso MySQL a `users` e criacao transacional da `wallet`.
- `src/services/AuthService.js`: regras de registro, login, logout, hash bcrypt e JWT.
- `src/controllers/AuthController.js`: camada HTTP das rotas de auth.
- `src/routes/AuthRoutes.js`: definicao das rotas publicas e privadas.
- `src/validators/authValidator.js`: validacao Joi de entrada.

Mais detalhes e exemplos: [`../docs/api/auth.md`](../docs/api/auth.md).

## Produtos

O CRUD de produtos usa MVC + Service + DAO + Router + Middleware:

- `src/models/ProductModel.js`
- `src/dao/ProductDAO.js`
- `src/services/ProductService.js`
- `src/controllers/ProductController.js`
- `src/routes/ProductRoutes.js`
- `src/validators/productValidator.js`

Regras principais:

- `GET /api/products` e `GET /api/products/:id` podem ser usados por usuarios comuns.
- `POST`, `PUT`, `DELETE` e upload de imagem exigem usuario `ADMIN`.
- Busca por nome: `GET /api/products?search=agua`.
- Filtros: `category` e `status=active|inactive|all`.
- `price_cents` e inteiro em centavos e nao aceita valor negativo.
- `DELETE` faz desativacao logica, atualizando `is_active=false`.
- Upload de imagem usa Multer e salva em `src/uploads/products`.
- `image_path` e salvo no MySQL como `/uploads/products/<arquivo>`.
- `CREATE`, `UPDATE` e `DELETE` sao registrados no MongoDB.

Mais detalhes: [`../docs/api/products.md`](../docs/api/products.md).

## Maquinas, Slots e Inventory

Os modulos `machines`, `slots` e `inventory` seguem o mesmo padrao MVC + Service + DAO:

- `src/models/MachineModel.js`, `SlotModel.js`, `InventoryModel.js`
- `src/dao/MachineDAO.js`, `SlotDAO.js`, `InventoryDAO.js`
- `src/services/MachineService.js`, `SlotService.js`, `InventoryService.js`
- `src/controllers/MachineController.js`, `SlotController.js`, `InventoryController.js`
- `src/routes/MachineRoutes.js`, `SlotRoutes.js`, `InventoryRoutes.js`
- `src/validators/machineValidator.js`, `slotValidator.js`, `inventoryValidator.js`

Regras principais:

- `GET /api/machines`, `GET /api/machines/:id`, `GET /api/machines/slug/:slug` e `GET /api/machines/slug/:slug/catalog` sao rotas publicas de consulta.
- Criar, editar e desativar maquinas, slots e estoque exige usuario `ADMIN`.
- `POST /api/machines` aceita `slots` para criacao dinamica junto da maquina.
- Slot pertence a uma maquina e guarda `code`, `motor_id`, `sensor_column_id` e `is_enabled`.
- Inventory pertence a um slot, aponta para produto valido e respeita a maquina do slot.
- `quantity_available`, `quantity_reserved` e `min_quantity_alert` nao aceitam valores negativos.
- `quantity_reserved` nao pode ser maior que `quantity_available`.
- `available_for_sale` e sempre calculado como `quantity_available - quantity_reserved`.
- O catalogo por slug retorna itens ativos em slots habilitados e indica se a maquina pode vender com `machine.can_sell`.
- Operacoes de escrita geram logs MongoDB com `table = machines`, `slots` ou `inventory`.

Mais detalhes:

- [`../docs/api/machines.md`](../docs/api/machines.md)
- [`../docs/api/slots.md`](../docs/api/slots.md)
- [`../docs/api/inventory.md`](../docs/api/inventory.md)

## Importacao e Exportacao JSON

O backend implementa import/export JSON para `products` e `inventory` com rotas administrativas:

- `GET /api/admin/export/json?entity=products`
- `GET /api/admin/export/json?entity=inventory`
- `POST /api/admin/import/json?entity=products`
- `POST /api/admin/import/json?entity=inventory`

Arquivos principais:

- `src/services/ImportExportService.js`
- `src/controllers/ImportExportController.js`
- `src/routes/ImportExportRoutes.js`
- `src/validators/importExportValidator.js`

Regras principais:

- apenas `ADMIN` pode importar ou exportar;
- exportacao busca dados do MySQL e retorna JSON legivel no envelope `{ entity, exported_at, count, records }`;
- importacao usa upload multipart no campo `file` e aceita somente arquivo `.json`;
- arquivo importado deve usar o envelope `{ entity, records }`;
- `products` nao sobrescreve SKUs existentes;
- `inventory` exige `machine_id`, `slot_id` e `product_id` validos e nao sobrescreve slot com inventory existente;
- JSON malformado, estrutura incorreta, entidade invalida e conflitos retornam erro padronizado;
- operacoes bem-sucedidas registram `IMPORT_JSON` ou `EXPORT_JSON` no MongoDB.

Documentacao e exemplos:

- [`../docs/api/import-export-json.md`](../docs/api/import-export-json.md)
- [`../docs/examples/products-import.example.json`](../docs/examples/products-import.example.json)
- [`../docs/examples/inventory-import.example.json`](../docs/examples/inventory-import.example.json)

## Logs e Exportacao XML

MongoDB e usado exclusivamente para logs. A exportacao XML usa `LogController`, `LogRoutes`, `LogService`, `LogDAO` e `xmlbuilder2`.

Rota administrativa:

- `GET /api/admin/logs/export/xml?user=&start_date=&end_date=&event_type=`

Filtros opcionais:

- `user`: filtra por `username`; se for numerico, filtra por `user_id`;
- `start_date`: data/hora inicial ISO 8601;
- `end_date`: data/hora final ISO 8601;
- `event_type`: tipo de evento, como `REQUEST_ACCESS`, `CREATE`, `ERROR`, `IMPORT_JSON` ou `EXPORT_XML`.

Regras principais:

- apenas `ADMIN` pode exportar logs;
- a resposta usa `Content-Type: application/xml` e `Content-Disposition: attachment`;
- o XML inclui usuario, acao, descricao, data/hora, tipo de evento, IP, dados HTTP e dados vinculados (`before`, `after`, `details`, `error`);
- toda exportacao bem-sucedida registra `EXPORT_XML` no MongoDB.

Mais detalhes: [`../docs/api/logs-xml-export.md`](../docs/api/logs-xml-export.md).

## Carteira e Pagamentos Mockados

Os modulos `wallet`, `wallet_transactions` e `payments` usam MySQL como fonte da verdade e MongoDB para logs:

- `src/models/WalletModel.js`, `WalletTransactionModel.js`, `PaymentModel.js`
- `src/dao/WalletDAO.js`, `WalletTransactionDAO.js`, `PaymentDAO.js`
- `src/services/WalletService.js`, `PaymentService.js`
- `src/controllers/WalletController.js`, `PaymentController.js`
- `src/routes/WalletRoutes.js`, `PaymentRoutes.js`
- `src/validators/walletValidator.js`, `paymentValidator.js`

Rotas privadas:

- `GET /api/wallet/balance`: retorna a wallet do usuario autenticado.
- `GET /api/wallet/transactions`: lista movimentacoes da wallet.
- `POST /api/wallet/topup/mock`: cria payment `MOCK_TOPUP` com status `PENDING`.
- `GET /api/payments/:id`: consulta pagamento do proprio usuario, ou qualquer pagamento quando `ADMIN`.
- `POST /api/payments/:id/confirm-mock`: confirma pagamento mockado.

Regras principais:

- saldos e valores usam centavos (`balance_cents`, `amount_cents`);
- saldo nunca pode ficar negativo, com regra tambem protegida no MySQL;
- recarga mockada nao credita saldo antes da confirmacao;
- confirmacao muda `payments.status` para `PAID`, preenche `paid_at`, credita wallet e cria `wallet_transactions`;
- confirmacao repetida e idempotente e nao duplica saldo;
- operacoes geram logs MongoDB em `payments`, `wallets` e `wallet_transactions`.

Mais detalhes: [`../docs/api/wallet-payments.md`](../docs/api/wallet-payments.md).

## Vendas e Checkout

O fluxo de compra usa carteira interna e executa as alteracoes criticas dentro de transacao MySQL:

- `src/models/SaleModel.js`, `SaleItemModel.js`, `DispenseCommandModel.js`
- `src/dao/SaleDAO.js`, `SaleItemDAO.js`, `DispenseCommandDAO.js`
- `src/services/SaleService.js`
- `src/controllers/SaleController.js`
- `src/routes/SaleRoutes.js`
- `src/validators/saleValidator.js`

Rotas privadas:

- `POST /api/sales/checkout`: compra um produto usando saldo.
- `GET /api/sales`: lista vendas do usuario autenticado.
- `GET /api/sales/:id`: detalha venda com itens, transacoes e comandos.
- `GET /api/users/me/purchases`: alias para historico de compras do usuario.

Regras principais:

- o frontend envia apenas `machine_id`, `slot_id` e `product_id`; o preco vem do MySQL;
- maquina deve estar ativa e `ONLINE`;
- slot deve estar habilitado e pertencer a maquina do inventory;
- produto deve estar ativo;
- inventory deve corresponder a maquina, slot e produto;
- saldo e estoque disponivel sao validados com locks transacionais;
- checkout debita wallet, cria `wallet_transactions` `DEBIT`, reserva estoque, cria `sales` `AUTHORIZED`, cria `sale_items` e cria `dispense_commands` `PENDING`;
- apos o commit, o backend publica o comando MQTT e marca `dispense_commands` como `PUBLISHED`;
- `Idempotency-Key` no header evita checkout duplicado em duplo clique;
- logs MongoDB registram `wallets`, `wallet_transactions`, `inventory`, `sales`, `sale_items` e `dispense_commands`.

Mais detalhes:

- [`../docs/api/sales.md`](../docs/api/sales.md)
- [`../docs/usage/purchase-flow.md`](../docs/usage/purchase-flow.md)

## Relatorios e Graficos

Os endpoints administrativos de relatorios e graficos usam MySQL como fonte dos dados e MongoDB apenas para auditoria.

Rotas:

- `GET /api/admin/reports/sales?start_date=&end_date=&machine_id=&status=`
- `GET /api/admin/reports/purchase-history?user_id=&start_date=&end_date=`
- `GET /api/admin/charts/sales-by-month?year=`

Arquivos principais:

- `src/dao/ReportDAO.js`
- `src/services/ReportService.js`
- `src/services/ChartService.js`
- `src/controllers/ReportController.js`
- `src/controllers/ChartController.js`
- `src/routes/ReportRoutes.js`
- `src/routes/ChartRoutes.js`
- `src/validators/reportValidator.js`
- `src/validators/chartValidator.js`

Regras principais:

- acesso restrito a `ADMIN`;
- relatorio de vendas retorna vendas, total vendido em centavos, quantidade de vendas, falhas, estornos, periodo e usuario que gerou;
- historico de compras retorna compras filtradas por usuario e periodo;
- grafico mensal retorna `labels` e `datasets` prontos para Chart.js;
- geracoes registram `GENERATE_PDF_REPORT` ou `GENERATE_CHART_DATA` no MongoDB.

Documentacao:

- [`../docs/api/reports.md`](../docs/api/reports.md)
- [`../docs/api/charts.md`](../docs/api/charts.md)

## MQTT e Eventos de Maquina

A integracao MQTT usa `mqtt.js` com HiveMQ publico por padrao.

Servicos:

- `src/services/MqttService.js`: conecta no broker, publica comandos e assina topicos.
- `src/services/DispenseCommandService.js`: publica comandos pendentes em `vending/{machine_id}/actions` e atualiza status para `PUBLISHED`.
- `src/services/MachineEventService.js`: processa heartbeat e eventos de dispensa, atualizando MySQL e logs MongoDB.

Quando o cliente MQTT ainda nao esta conectado, a publicacao fica enfileirada no `mqtt.js` e a requisicao HTTP nao fica presa aguardando indefinidamente o broker publico.

Topicos:

- `vending/{machine_id}/actions`: backend publica `DISPENSE`.
- `vending/{machine_id}/events`: ESP32-S3 ou simulador publica eventos.
- `vending/{machine_id}/status`: ESP32-S3 ou simulador publica `HEARTBEAT`.

Eventos processados:

- `HEARTBEAT`: atualiza `machines.last_seen_at` e status `ONLINE`.
- `DISPENSE_STARTED`: move venda autorizada para `DISPENSING`.
- `DISPENSE_SUCCESS`: comando `SUCCESS`, venda `DISPENSED`, baixa definitiva do estoque reservado.
- `DISPENSE_FAILED`: comando `FAILED`, venda `FAILED` e depois `REFUNDED`, libera reserva e estorna wallet uma unica vez.
- `SENSOR_TRIGGERED`, `DISPENSE_RETRY`, `MOTOR_ERROR`, `MACHINE_ERROR`: registrados como eventos operacionais.

Mais detalhes:

- [`../docs/api/mqtt.md`](../docs/api/mqtt.md)
- [`../docs/usage/mqtt-flow.md`](../docs/usage/mqtt-flow.md)
