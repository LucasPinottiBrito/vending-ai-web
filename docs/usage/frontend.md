# Frontend usage and validation

Este guia documenta a base frontend Next.js/React criada para a Vending AI Web Platform.

## Objetivo

O frontend deve ser a camada de visualizacao e interacao do usuario. Ele consome somente a API Express e nao acessa MySQL nem MongoDB diretamente.

## Como rodar localmente

Na raiz do repositorio, suba os servicos necessarios ou rode pelo menos backend, MySQL e MongoDB:

```bash
docker compose up --build backend mysql mongodb
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- Backend API health: `http://localhost:4000/api/health`

## Como rodar via Docker

Na raiz do repositorio:

```bash
docker compose up --build
```

Resultado esperado:

- `frontend` em `http://localhost:3000`
- `backend` em `http://localhost:4000`
- `mysql` em `localhost:3306`
- `mongodb` em `localhost:27017`

## Credenciais seed

As credenciais estao em `database/mysql/seed.sql`:

- ADMIN: `admin@example.com` / `Admin@123`
- USER: `cliente@example.com` / `Cliente@123`

## Validacao manual obrigatoria

### Base e navegacao

1. Abrir `/`.
2. Confirmar menu superior com links para inicio, catalogo, conta e admin.
3. Confirmar home com linguagem de produto, CTAs para maquinas e conta.
4. Abrir `/catalogo` e confirmar selecao de maquinas disponiveis.
5. Abrir `/machine/hall-principal` e confirmar redirecionamento para `/m/hall-principal`.

### Autenticacao

1. Abrir `/login`.
2. Entrar com `cliente@example.com` / `Cliente@123`.
3. Confirmar redirecionamento para `/account`.
4. Sair pelo menu do usuario.
5. Abrir `/register` e confirmar validacao de campos obrigatorios.

### Catalogo e compra

1. Abrir `/catalogo`.
2. Selecionar uma maquina e navegar para `/m/[slug]`.
3. Confirmar que os produtos vem do catalogo publico da maquina.
4. Usar busca por produto.
5. Abrir detalhes de um produto.
6. Abrir checkout de um slot.
7. Confirmar que o frontend envia somente `machine_id`, `slot_id` e `product_id`; preco, saldo e estoque sao validados no backend.
8. Em compra autorizada, confirmar redirecionamento para `/purchase/[id]`.

### Conta e carteira

1. Abrir `/account`.
2. Abrir `/account/wallet`.
3. Confirmar saldo vindo de `/api/wallet/balance`.
4. Criar recarga mockada.
5. Confirmar que o fluxo chama `/api/wallet/topup/mock` e depois `/api/payments/:id/confirm-mock`.
6. Confirmar listagem de transacoes em `/api/wallet/transactions`.

### Administracao

Entrar como `admin@example.com` / `Admin@123`.

1. Abrir `/admin`.
2. Confirmar menu lateral e breadcrumb nas paginas administrativas.
3. Abrir `/admin/machines`, listar e criar maquina.
4. Abrir `/admin/products`, listar, criar produto e enviar imagem.
5. Abrir `/admin/inventory`, listar estoque e ajustar quantidade.
6. Abrir `/admin/sales`, confirmar dados via `/api/admin/reports/sales`.
7. Abrir `/admin/import-export`, exportar e importar JSON de `products` ou `inventory`.
8. Abrir `/admin/logs`, exportar XML usando `/api/admin/logs/export/xml`.
9. Abrir `/admin/reports`, gerar PDF com jsPDF a partir dos endpoints de relatorio.
10. Abrir `/admin/charts`, carregar grafico mensal com Chart.js.

## Endpoints pendentes no backend atual

Estas telas existem para manter a navegacao academica, mas nao usam mocks nem acesso direto a banco:

- `/admin/users`: backend ainda nao expoe `/api/admin/users`.
- `/admin/payments`: backend ainda nao expoe listagem administrativa de pagamentos.
- `/admin/events`: backend processa eventos MQTT, mas ainda nao expoe listagem HTTP de eventos.
- `/admin/logs`: backend expoe exportacao XML, mas ainda nao expoe listagem paginada de logs.

## Comandos de validacao

```bash
cd frontend
npm run lint
npm run build
```

Validacao HTTP local:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```

Validacao Docker:

```bash
docker compose up --build
docker compose ps
```
