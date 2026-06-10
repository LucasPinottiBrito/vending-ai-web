# Frontend authentication flow

Este guia documenta as telas e o fluxo de autenticacao do frontend Next.js/React.

## Rotas

- `/login`: tela publica de login.
- `/register`: tela publica de cadastro.
- `/account`: area privada do usuario autenticado.
- `/admin`: area administrativa, protegida por role `ADMIN`.

## Contrato do backend

O frontend consome somente a API Express:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`

O backend retorna um envelope JSON padronizado. Em caso de erro, o frontend exibe `message` amigavel ou codigo controlado, nunca stack trace.

## Validacao frontend

As telas usam React Hook Form + Zod:

- login exige e-mail valido e senha preenchida;
- registro exige nome, e-mail valido e senha com no minimo 8 caracteres;
- erros de campo aparecem abaixo do campo;
- erros da API aparecem em toast Sonner e mensagem inline.

## Armazenamento do token

O backend retorna JWT Bearer no corpo da resposta. Como o backend atual nao emite cookie httpOnly, o padrao usado no frontend e:

- armazenar `{ user, token }` em `localStorage` na chave `vending-ai-session`;
- nunca exibir o token em tela;
- nunca registrar token completo em mensagens de erro;
- remover sessao local se o formato armazenado estiver invalido;
- sincronizar alteracoes de login/logout por evento local e evento `storage`.

## Envio automatico do token

Todas as chamadas passam por `frontend/lib/api.ts`.

Quando `apiRequest`, `apiUpload` ou `apiDownload` sao chamados sem `token: null`, o client:

1. le a sessao local;
2. injeta `Authorization: Bearer <token>`;
3. interpreta o envelope do backend;
4. em erro, lanca `ApiClientError` com `status`, `code`, `message` e `details`.

Chamadas publicas, como login e registro, passam `token: null`.

## Protecao de rotas

`RouteGuard` protege telas privadas:

- sem token: redireciona para `/login?returnTo=<rota>`;
- com token: renderiza o conteudo privado;
- com `adminOnly`: exige `user.role === "ADMIN"`;
- usuario autenticado sem role admin recebe mensagem controlada e link para `/account`.

O guard e aplicado em `/account` e nas areas administrativas por meio de `AdminShell`.

## Logout

O menu do usuario chama `logoutSession()`:

1. se houver token, tenta chamar `POST /api/auth/logout`;
2. independentemente do resultado da API, remove a sessao local;
3. emite evento de autenticacao;
4. redireciona para `/login`.

## Validacao manual

### Cadastro com sucesso

1. Abrir `http://localhost:3000/register`.
2. Informar nome, e-mail novo e senha com pelo menos 8 caracteres.
3. Confirmar toast de sucesso.
4. Confirmar redirecionamento para `/account`.

### Login com sucesso

1. Abrir `http://localhost:3000/login`.
2. Usar seed `cliente@example.com` / `Cliente@123`.
3. Confirmar redirecionamento para `/account`.
4. Confirmar nome do usuario no menu superior.

### Login invalido

1. Abrir `/login`.
2. Usar e-mail valido com senha incorreta.
3. Confirmar erro amigavel.
4. Confirmar que nenhuma stack trace aparece em tela.

### Acessar area privada sem token

1. Executar logout ou limpar `localStorage`.
2. Abrir `/account`.
3. Confirmar redirecionamento para `/login?returnTo=%2Faccount`.

### Acessar area privada com token

1. Fazer login valido.
2. Abrir `/account`.
3. Confirmar renderizacao do painel da conta.

### Protecao admin

1. Fazer login como `cliente@example.com`.
2. Abrir `/admin`.
3. Confirmar mensagem `Acesso administrativo necessario`.
4. Fazer login como `admin@example.com` / `Admin@123`.
5. Abrir `/admin`.
6. Confirmar renderizacao do painel administrativo.

### Logout

1. Fazer login.
2. Usar o menu do usuario e clicar em `Sair`.
3. Confirmar redirecionamento para `/login`.
4. Abrir `/account` novamente.
5. Confirmar novo redirecionamento para login.

## Comandos de apoio

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e -- tests/auth-frontend.spec.ts --browser=chromium
```

Com Docker ativo:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
Invoke-WebRequest -Uri http://localhost:3000/login -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/register -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/account -UseBasicParsing
```
