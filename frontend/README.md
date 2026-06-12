# Frontend - Vending AI Web Platform

Aplicacao Next.js/React da plataforma web da vending machine. O frontend consome somente o backend Express configurado em `NEXT_PUBLIC_API_URL`; nao acessa MySQL nem MongoDB diretamente.

## Stack

- Next.js 16 com App Router.
- React 19.
- TypeScript.
- TailwindCSS v4.
- shadcn/ui com Radix UI.
- React Hook Form + Zod.
- Sonner para toast.
- Chart.js via `react-chartjs-2`.
- jsPDF para geracao de relatorios PDF no navegador.

## Variaveis

Copie o exemplo se quiser customizar o ambiente local:

```bash
cp .env.example .env
```

Valores esperados:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_SUPPORT_URL=https://wa.me/55XXXXXXXXXXX
```

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test:e2e -- tests/auth-frontend.spec.ts --browser=chromium
npm start
```

Em desenvolvimento, acesse:

```txt
http://localhost:3000
```

## Rotas principais

Publicas e cliente:

- `/`
- `/catalogo`
- `/login`
- `/register`
- `/m/[slug]`
- `/m/[slug]/product/[productId]`
- `/m/[slug]/checkout/[slotId]`
- `/machine/[slug]` redireciona para `/m/[slug]`
- `/purchase/[id]`
- `/account`
- `/account/wallet`
- `/account/purchases`

Administrativas:

- `/admin`
- `/admin/machines`
- `/admin/products`
- `/admin/inventory`
- `/admin/sales`
- `/admin/import-export`
- `/admin/reports`
- `/admin/charts`
- `/admin/logs`

Rotas administrativas criadas com aviso de endpoint pendente:

- `/admin/users`
- `/admin/payments`
- `/admin/events`

## Integracao com backend

O client central fica em `lib/api.ts` e padroniza:

- `NEXT_PUBLIC_API_URL`;
- headers `Authorization: Bearer <token>`;
- parse do envelope `{ success, message, data, error }`;
- `ApiClientError`;
- upload multipart;
- download de JSON/XML;
- helper para baixar `Blob`.

Sessao JWT fica em `lib/auth.ts` usando `localStorage`, porque o backend retorna token Bearer e nao cookie httpOnly nesta fase academica. O token nao e exibido em tela, nao e registrado em logs do frontend e e enviado automaticamente pelo `apiRequest` nas chamadas autenticadas.

## Autenticacao frontend

Rotas implementadas:

- `/login`: formulario com React Hook Form + Zod, consumo de `POST /api/auth/login`, feedback por Sonner e mensagem inline sem stack trace.
- `/register`: formulario com React Hook Form + Zod, consumo de `POST /api/auth/register`, armazenamento da sessao retornada e redirecionamento para `/account`.
- `/account`: rota privada protegida por `RouteGuard`.

Componentes e bibliotecas principais:

- `components/forms/AuthForms.tsx`: telas de login e registro.
- `lib/auth.ts`: armazenamento, leitura, atualizacao e logout da sessao JWT.
- `hooks/useAuth.ts`: hook de sessao com sincronizacao entre header, guards e paginas.
- `components/layout/RouteGuard.tsx`: protecao de rotas privadas e admin.
- `lib/api.ts`: injeta `Authorization: Bearer <token>` automaticamente quando ha sessao armazenada.

Logout chama `POST /api/auth/logout` quando existe token local e sempre limpa a sessao no navegador ao final.

## Validacao manual

1. Suba o backend em `http://localhost:4000`.
2. Rode `npm run dev`.
3. Abra `http://localhost:3000`.
4. Confirme a home com linguagem de produto e chamadas para selecionar maquinas.
5. Teste login com os seeds:
   - `admin@example.com` / `Admin@123`
   - `cliente@example.com` / `Cliente@123`
6. Acesse `/catalogo`, escolha uma maquina e confira o catalogo em `/m/[slug]`.
7. Acesse `/account/wallet` e teste a recarga de demonstracao.
8. Acesse `/admin` com usuario ADMIN e navegue entre gerenciamento, JSON, XML, PDF e indicadores.

Mais detalhes: `../docs/usage/frontend.md`.
Polimento de produto: `../docs/usage/frontend-polishing.md`.
Fluxo de autenticacao: `../docs/usage/auth-frontend.md`.
Fluxo do catalogo (QR Code): `../docs/usage/catalog-flow.md`.
Fluxo da carteira (Recarga): `../docs/usage/wallet-flow.md`.
Fluxo de checkout e compra: `../docs/usage/checkout-flow.md`.
Historico de compras: `../docs/usage/purchase-history.md`.
Painel administrativo: `../docs/usage/admin-panel.md`.
Gestao de produtos: `../docs/usage/admin-products.md`.
Gestao de maquinas e inventario: `../docs/usage/admin-machines-inventory.md`.
Relatorios e graficos: `../docs/usage/reports-and-charts.md`.
Importacao e exportacao JSON: `../docs/usage/import-export-json.md`.
Auditoria e logs XML: `../docs/usage/admin-logs.md`.
