# Vending Machine Web Platform

Plataforma web full stack para gerenciamento de uma vending machine IoT. O projeto atende aos requisitos academicos da disciplina de Desenvolvimento de Aplicacao Web Full Stack e preserva um caminho limpo para integracao com ESP32-S3 via MQTT.

Este repositorio esta na fase inicial de implementacao. A infraestrutura Docker ja sobe os quatro servicos principais, com backend Express estruturado em MVC + Service Layer + Router + Middleware, frontend Next.js inicial, MySQL e MongoDB.

## Objetivo

Construir uma aplicacao web para:

- permitir que usuarios acessem uma maquina por QR Code, consultem produtos, recarreguem carteira em modo mock e comprem um item;
- permitir que administradores gerenciem maquinas, slots, produtos, inventario, usuarios, vendas, pagamentos, logs, relatorios e graficos;
- manter o backend como fonte da verdade para autenticacao, saldo, estoque, autorizacao de venda e comandos de dispensa;
- registrar logs em MongoDB e dados de negocio em MySQL;
- preparar a integracao complementar com ESP32-S3 e MQTT sem misturar firmware com a aplicacao web.

## Stack obrigatoria

- Backend: Node.js + Express.
- Frontend: Next.js/React com HTML5, CSS3 e JavaScript.
- Banco relacional principal: MySQL.
- Banco NoSQL: MongoDB somente para logs.
- Autenticacao: JWT proprio no backend.
- Arquitetura backend: MVC + Service Layer + Router + Middleware.
- Docker: quatro servicos principais, `backend`, `frontend`, `mysql` e `mongodb`.

## Servicos Docker previstos

- `backend`: API Node.js + Express, porta `4000`.
- `frontend`: aplicacao Next.js/React, porta `3000`.
- `mysql`: banco relacional principal, porta `3306`.
- `mongodb`: armazenamento de logs, porta `27017`.

O broker MQTT sera externo, usando HiveMQ publico, e nao sera adicionado ao Docker Compose salvo pedido explicito.

O MySQL inicializa automaticamente com:

- `database/mysql/schema.sql`
- `database/mysql/seed.sql`

Esses scripts sao executados pelo container apenas quando o volume `mysql_data` esta vazio.

## Como executar com Docker

Antes de subir pela primeira vez, copie os arquivos de exemplo de variaveis se quiser customizar valores locais:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Se os arquivos `.env` nao existirem, o Docker Compose usa os valores de `.env.example`.

Para validar a configuracao:

```bash
docker compose config
```

Para construir e subir todos os servicos:

```bash
docker compose up --build
```

Para subir em segundo plano:

```bash
docker compose up --build -d
```

Para parar os servicos sem remover volumes:

```bash
docker compose down
```

Para limpar containers, rede e volumes persistentes:

```bash
docker compose down -v
```

Essa limpeza remove `mysql_data` e `mongo_data`; os dados dos bancos serao perdidos.

Para recriar o banco MySQL do zero com schema e seed:

```bash
docker compose down -v
docker compose up --build -d mysql
```

## URLs locais

- Frontend: http://localhost:3000
- Backend healthcheck: http://localhost:4000/health
- Backend healthcheck com prefixo de API: http://localhost:4000/api/health
- MySQL: `localhost:3306`
- MongoDB: `localhost:27017`

## Frontend Next.js

O frontend em `frontend/` usa Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Radix UI, React Hook Form, Zod, Sonner, Chart.js e jsPDF.

Caracteristicas implementadas:

- layout base com menu superior;
- navegacao publica, cliente e administrativa;
- breadcrumbs nas paginas administrativas;
- client HTTP centralizado em `frontend/lib/api.ts`;
- sessao JWT em `frontend/lib/auth.ts` usando token Bearer retornado pelo backend;
- login, registro, logout, protecao de rotas privadas e protecao de rotas admin no frontend;
- envio automatico do token pelo client centralizado nas chamadas autenticadas;
- tratamento padrao de erro via `ApiClientError`;
- catalogo por maquina consumindo `/api/machines/slug/:slug/catalog`;
- login, cadastro, carteira, recarga mockada, compras e historico;
- telas administrativas para maquinas, produtos, inventory, vendas, import/export JSON, logs XML, PDF e Chart.js;
- paginas administrativas sem endpoint atual marcadas como pendentes, sem mocks e sem acesso direto aos bancos.

Documentacao:

- [`frontend/README.md`](frontend/README.md)
- [`docs/usage/frontend.md`](docs/usage/frontend.md)
- [`docs/usage/auth-frontend.md`](docs/usage/auth-frontend.md)

## Backend Express

O backend em `backend/` usa Node.js + Express com JavaScript e classes para manter a arquitetura demonstravel da disciplina.

Camadas implementadas nesta base:

- `routes`: registra endpoints e aplica middlewares por recurso.
- `controllers`: recebe `req`, `res`, `next`, chama services e retorna JSON padronizado.
- `services`: concentra regras de negocio e orquestracao.
- `dao`: concentra acesso a persistencia. Nesta base, `LogDAO` acessa MongoDB.
- `middlewares`: autenticacao JWT, log de requests, tratamento global de erro e validacao Joi.
- `interfaces`: contratos obrigatorios `IDAO`, `IService` e `IController` como classes base abstratas.

Resposta JSON padrao de sucesso:

```json
{
  "success": true,
  "message": "Backend is healthy",
  "data": {},
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Resposta JSON padrao de erro:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Documentacao detalhada:

- [`backend/README.md`](backend/README.md)
- [`docs/api/backend-architecture.md`](docs/api/backend-architecture.md)
- [`docs/api/auth.md`](docs/api/auth.md)
- [`docs/api/middlewares.md`](docs/api/middlewares.md)
- [`docs/api/products.md`](docs/api/products.md)
- [`docs/api/machines.md`](docs/api/machines.md)
- [`docs/api/slots.md`](docs/api/slots.md)
- [`docs/api/inventory.md`](docs/api/inventory.md)
- [`docs/api/import-export-json.md`](docs/api/import-export-json.md)
- [`docs/api/logs-xml-export.md`](docs/api/logs-xml-export.md)
- [`docs/api/wallet-payments.md`](docs/api/wallet-payments.md)
- [`docs/api/sales.md`](docs/api/sales.md)
- [`docs/api/reports.md`](docs/api/reports.md)
- [`docs/api/charts.md`](docs/api/charts.md)
- [`docs/api/mqtt.md`](docs/api/mqtt.md)
- [`docs/usage/purchase-flow.md`](docs/usage/purchase-flow.md)
- [`docs/usage/catalog-flow.md`](docs/usage/catalog-flow.md)
- [`docs/usage/wallet-flow.md`](docs/usage/wallet-flow.md)
- [`docs/usage/checkout-flow.md`](docs/usage/checkout-flow.md)
- [`docs/usage/purchase-history.md`](docs/usage/purchase-history.md)
- [`docs/usage/admin-panel.md`](docs/usage/admin-panel.md)
- [`docs/usage/admin-products.md`](docs/usage/admin-products.md)
- [`docs/usage/admin-machines-inventory.md`](docs/usage/admin-machines-inventory.md)
- [`docs/usage/reports-and-charts.md`](docs/usage/reports-and-charts.md)
- [`docs/usage/import-export-json.md`](docs/usage/import-export-json.md)
- [`docs/usage/admin-logs.md`](docs/usage/admin-logs.md)
- [`docs/usage/frontend-validation-report.md`](docs/usage/frontend-validation-report.md)
- [`docs/usage/mqtt-flow.md`](docs/usage/mqtt-flow.md)
- [`docs/usage/uploads.md`](docs/usage/uploads.md)
- [`docs/examples/products-import.example.json`](docs/examples/products-import.example.json)
- [`docs/examples/inventory-import.example.json`](docs/examples/inventory-import.example.json)

### Autenticacao JWT

O backend implementa autenticacao local propria, sem Supabase Auth e sem Google Login.

Rotas publicas:

- `POST /api/auth/register`
- `POST /api/auth/login`

Rotas privadas:

- `GET /api/auth/me`
- `POST /api/auth/logout`

Regras implementadas:

- senha armazenada com hash bcrypt em `users.password_hash`;
- JWT assinado com `JWT_SECRET`;
- `auth_middleware` protegendo rotas privadas;
- registro cria `users` e `wallets` em transacao MySQL;
- login e logout registram eventos no MongoDB;
- respostas nunca retornam `password_hash`.

### Middlewares Obrigatorios

Os quatro middlewares obrigatorios estao implementados no backend:

- `auth_middleware`: valida JWT, preenche `req.user`, bloqueia token ausente/invalido e usuario inativo.
- `log_middleware`: registra cada request no MongoDB com endpoint, metodo, usuario, timestamp, IP, status code, tempo de resposta e user agent.
- `error_middleware`: centraliza excecoes, retorna JSON padronizado e registra stack trace no MongoDB sem expor stack ao frontend.
- `validation_middleware`: valida `body`, `params` e `query` via Joi antes do controller e retorna erro `400` padronizado.

### Produtos

O backend implementa CRUD completo de produtos em `/api/products`.

Rotas publicas ou acessiveis a usuario comum:

- `GET /api/products`
- `GET /api/products/:id`

Rotas administrativas:

- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/image`

Recursos implementados:

- busca por nome com `search`;
- filtro por `category`;
- filtro por `status=active|inactive|all`;
- preco em centavos com `price_cents`;
- bloqueio de preco negativo;
- upload local com Multer em `backend/src/uploads/products`;
- imagens servidas por `/uploads/products/<arquivo>`;
- logs MongoDB para `CREATE`, `UPDATE` e `DELETE`.

### Maquinas, Slots e Estoque

O backend tambem implementa os modulos operacionais de maquinas, slots e inventory:

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

Regras implementadas:

- apenas `ADMIN` cria, edita e desativa maquinas, slots e estoque;
- maquina pode ser criada com array dinamico de `slots`;
- slot pertence a uma maquina e guarda `motor_id` e `sensor_column_id`;
- inventory pertence a um slot, aponta para produto valido e respeita a maquina do slot;
- quantidades negativas sao bloqueadas;
- `available_for_sale` e calculado como `quantity_available - quantity_reserved`;
- catalogo por slug retorna somente produtos ativos em slots habilitados e informa `machine.can_sell`;
- alteracoes geram logs MongoDB em `machines`, `slots` e `inventory`.

### Importacao e Exportacao JSON

O backend implementa import/export JSON administrativo para `products` e `inventory`.

Rotas:

- `GET /api/admin/export/json?entity=products`
- `GET /api/admin/export/json?entity=inventory`
- `POST /api/admin/import/json?entity=products`
- `POST /api/admin/import/json?entity=inventory`

Recursos implementados:

- acesso restrito a `ADMIN`;
- exportacao de dados MySQL em JSON legivel;
- importacao por upload multipart no campo `file`;
- formato padrao `{ entity, records }`;
- validacao de entidade, extensao `.json`, JSON malformado e estrutura dos registros;
- `products` rejeita SKUs duplicados ou ja existentes;
- `inventory` valida maquina, slot, produto e quantidades antes de inserir;
- importacao nao sobrescreve dados existentes;
- logs MongoDB `IMPORT_JSON` e `EXPORT_JSON`.

Documentacao e exemplos:

- [`docs/api/import-export-json.md`](docs/api/import-export-json.md)
- [`docs/examples/products-import.example.json`](docs/examples/products-import.example.json)
- [`docs/examples/inventory-import.example.json`](docs/examples/inventory-import.example.json)

### Logs e Exportacao XML

MongoDB armazena logs da aplicacao na colecao `vending_logs.logs`, e o backend exporta esses registros em XML por rota administrativa.

Rota:

- `GET /api/admin/logs/export/xml?user=&start_date=&end_date=&event_type=`

Recursos implementados:

- acesso restrito a `ADMIN`;
- filtros opcionais por usuario, data inicial, data final e tipo de evento;
- consulta feita pelo `LogDAO` no MongoDB;
- XML legivel gerado com `xmlbuilder2`;
- download com `Content-Type: application/xml` e `Content-Disposition`;
- cada log exportado inclui usuario, acao, descricao, data/hora, tipo, IP, endpoint, status, tempo de resposta e dados vinculados;
- a propria exportacao registra `EXPORT_XML` no MongoDB.

Mais detalhes: [`docs/api/logs-xml-export.md`](docs/api/logs-xml-export.md).

### Carteira e Pagamentos Mockados

O backend implementa carteira interna com saldo em centavos e recarga mockada:

- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `POST /api/wallet/topup/mock`
- `GET /api/payments/:id`
- `POST /api/payments/:id/confirm-mock`

Regras implementadas:

- usuario autenticado consulta apenas a propria carteira;
- saldo e armazenado em `wallets.balance_cents`;
- recarga mockada cria `payment` com `status=PENDING`;
- confirmacao mockada muda o pagamento para `PAID`;
- confirmacao credita a carteira e cria `wallet_transactions`;
- confirmacao e idempotente: repetir `confirm-mock` nao duplica saldo nem transacao;
- toda movimentacao relevante gera logs MongoDB em `payments`, `wallets` e `wallet_transactions`.

### Compra com Saldo

O backend implementa checkout com carteira interna em `/api/sales/checkout`.

Rotas privadas:

- `POST /api/sales/checkout`
- `GET /api/sales`
- `GET /api/sales/:id`
- `GET /api/users/me/purchases`

Regras implementadas:

- compra exige JWT e usa o usuario autenticado;
- cada checkout compra um produto por vez;
- preco e buscado no MySQL em `products.price_cents`;
- backend valida maquina ativa e `ONLINE`, slot habilitado, produto ativo e inventory correspondente;
- saldo e estoque disponivel sao validados dentro de transacao MySQL;
- saldo e debitado em `wallets`;
- `wallet_transactions` recebe um `DEBIT`;
- `inventory.quantity_reserved` e incrementado;
- `sales` e criada com status `AUTHORIZED`;
- `sale_items` registra o item vendido;
- `dispense_commands` e criado com status `PENDING`, publicado via MQTT e marcado como `PUBLISHED`;
- `Idempotency-Key` previne duplicacao em duplo clique.

### Relatorios e Graficos

O backend fornece dados administrativos para PDF e Chart.js usando MySQL.

Rotas:

- `GET /api/admin/reports/sales?start_date=&end_date=&machine_id=&status=`
- `GET /api/admin/reports/purchase-history?user_id=&start_date=&end_date=`
- `GET /api/admin/charts/sales-by-month?year=`

Recursos implementados:

- acesso restrito a `ADMIN`;
- relatorio de vendas por periodo com vendas, total vendido, quantidade de vendas, falhas, estornos, periodo consultado e usuario gerador;
- historico de compras filtrado por usuario e periodo;
- grafico mensal com `labels` e `datasets` prontos para Chart.js;
- logs MongoDB `GENERATE_PDF_REPORT` e `GENERATE_CHART_DATA`.

Documentacao:

- [`docs/api/reports.md`](docs/api/reports.md)
- [`docs/api/charts.md`](docs/api/charts.md)

### MQTT e Eventos de Maquina

O backend usa `mqtt.js` para publicar comandos e processar eventos da maquina ou simulador.

Topicos:

- `vending/{machine_id}/actions`: backend publica comandos.
- `vending/{machine_id}/events`: ESP32-S3 ou simulador publica eventos.
- `vending/{machine_id}/status`: ESP32-S3 ou simulador publica heartbeat.

Servicos implementados:

- `MqttService`: conexao HiveMQ, publish e subscribe.
- `DispenseCommandService`: publica comandos `PENDING` e marca `PUBLISHED`.
- `MachineEventService`: processa `HEARTBEAT`, `DISPENSE_STARTED`, `DISPENSE_SUCCESS`, `DISPENSE_FAILED` e demais eventos operacionais.

Quando o cliente MQTT ainda nao esta conectado, a publicacao fica enfileirada no `mqtt.js` e o checkout nao fica bloqueado aguardando indefinidamente o broker publico.

Eventos `DISPENSE_SUCCESS` finalizam estoque reservado e venda. Eventos `DISPENSE_FAILED` liberam reserva, estornam saldo uma unica vez e marcam a venda como `REFUNDED`.

## Portas usadas

| Servico | Porta host | Porta container |
| --- | ---: | ---: |
| frontend | 3000 | 3000 |
| backend | 4000 | 4000 |
| mysql | 3306 | 3306 |
| mongodb | 27017 | 27017 |

## Volumes e rede

- `mysql_data`: dados persistentes do MySQL.
- `mongo_data`: dados persistentes do MongoDB.
- `./backend/src/uploads/products`: pasta local montada no backend para imagens de produtos.
- `vending_network`: rede Docker bridge propria da aplicacao.

Guia detalhado: [`docs/usage/docker.md`](docs/usage/docker.md).

## Validação da infraestrutura

A validacao completa da infraestrutura esta documentada em [`docs/usage/infrastructure-validation.md`](docs/usage/infrastructure-validation.md).

Fluxo recomendado para subir tudo do zero:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
```

Validacoes principais:

```bash
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot_pass
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SHOW TABLES; SELECT COUNT(*) AS products_count FROM products;" vending_machine
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
Invoke-RestMethod -Uri http://localhost:4000/api/health
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Resultado esperado: os quatro containers ficam `Up`, MySQL responde `mysqld is alive`, MongoDB responde `{ ok: 1 }`, o backend temporario responde `/health` e o frontend temporario abre em `http://localhost:3000`.

## Banco MySQL

O schema usa `BIGINT UNSIGNED AUTO_INCREMENT` como padrao de chave primaria. As tabelas principais sao:

- `users`
- `wallets`
- `machines`
- `slots`
- `products`
- `inventory`
- `sales`
- `sale_items`
- `payments`
- `wallet_transactions`
- `dispense_commands`
- `machine_events`

Relacionamentos academicos demonstraveis:

- 1:N: `machines -> slots`, `users -> sales`, `wallets -> wallet_transactions`.
- N:N: `sales -> products` por meio de `sale_items`.

Documentacao:

- [`database/mysql/README.md`](database/mysql/README.md)
- [`docs/database/mysql-schema.md`](docs/database/mysql-schema.md)
- [`docs/diagrams/mysql-der.md`](docs/diagrams/mysql-der.md)

Consultas rapidas:

```bash
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SHOW TABLES;" vending_machine
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SELECT id, sku, name, price_cents FROM products;" vending_machine
```

## Logs MongoDB

MongoDB e usado exclusivamente para logs do sistema. A colecao principal e:

```txt
vending_logs.logs
```

Eventos obrigatorios:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `LOGOUT`
- `REQUEST_ACCESS`
- `CREATE`
- `UPDATE`
- `DELETE`
- `ERROR`
- `EXCEPTION`
- `IMPORT_JSON`
- `EXPORT_JSON`
- `EXPORT_XML`
- `GENERATE_PDF_REPORT`
- `GENERATE_CHART_DATA`

Documentacao:

- [`database/mongodb/README.md`](database/mongodb/README.md)
- [`docs/database/mongodb-logs.md`](docs/database/mongodb-logs.md)

Exemplos:

- [`database/mongodb/examples/request-log.example.json`](database/mongodb/examples/request-log.example.json)
- [`database/mongodb/examples/auth-log.example.json`](database/mongodb/examples/auth-log.example.json)
- [`database/mongodb/examples/crud-log.example.json`](database/mongodb/examples/crud-log.example.json)
- [`database/mongodb/examples/error-log.example.json`](database/mongodb/examples/error-log.example.json)

Consulta rapida:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.logs.find({event_type:'REQUEST_ACCESS'}).limit(5).toArray()"
```

## Estrutura de pastas

```txt
/
  backend/              # modulo da API Express
  frontend/             # modulo da aplicacao Next.js/React
  database/
    mysql/              # scripts MySQL futuros
    mongodb/            # material de apoio futuro para logs
    der/                # DER do MySQL
  docs/
    api/                # documentacao de endpoints
    database/           # documentacao de bancos e modelos
    usage/              # guias de uso e desenvolvimento
    diagrams/           # diagramas auxiliares
  firmware/             # firmware ESP32-S3, complementar ao web
  uploads/              # arquivos persistentes usados em desenvolvimento
  docker-compose.yml
  README.md
  AGENTS.md
  GEMINI.md
```

## Desenvolvimento por modulos

O projeto sera desenvolvido em etapas para manter os requisitos demonstraveis:

1. Infraestrutura Docker.
2. Banco MySQL com schema e seed.
3. MongoDB para logs.
4. Backend Express com MVC, services, DAOs, rotas e middlewares.
5. Frontend Next.js/React.
6. Integracao MQTT com ESP32-S3.
7. Testes finais, documentacao e preparacao da entrega.

O firmware fica em `firmware/` e e complementar. Ele deve seguir o contrato MQTT definido pelo backend, mas nao deve comprometer os requisitos obrigatorios da plataforma web.

## Testes do backend

Com MySQL e MongoDB ativos, rode:

```bash
cd backend
npm install
npm test
```

Os testes atuais validam:

- `/health` e `/api/health`;
- conexao MySQL com `SELECT 1 AS ok`;
- conexao MongoDB com `ping`;
- resposta padronizada do `error_middleware`;
- registro, login, logout, protecao JWT, wallet criada no registro e logs de login no MongoDB;
- middlewares obrigatorios: token ausente/invalido/valido, usuario inativo, logs de request, logs de erro global e validacao de body invalido;
- CRUD de produtos, autorizacao ADMIN, busca/filtros, upload de imagem e logs MongoDB de `CREATE`, `UPDATE` e `DELETE`.
- CRUD de maquinas, CRUD de slots, CRUD de inventory, criacao de maquina com slots, estoque negativo bloqueado, catalogo por slug e logs MongoDB de alteracoes.
- carteira interna, recarga mockada, confirmacao idempotente, listagem de transacoes e logs MongoDB de pagamentos/carteira.
- checkout com saldo, bloqueios por saldo/estoque/maquina offline, reserva de estoque, criacao de venda/item/comando, idempotencia e logs MongoDB.
- MQTT com publish mockado, heartbeat, eventos de dispensa, idempotencia de sucesso/falha e estorno unico.
- import/export JSON de `products` e `inventory`, rejeicao de JSON malformado, estrutura incorreta, entidade invalida e logs MongoDB.
- exportacao XML de logs MongoDB sem filtros, por usuario, por data, por tipo de evento, content-type e estrutura XML.
- dados de relatorio de vendas, historico de compras, grafico mensal Chart.js, comparacao com MySQL e logs MongoDB.
