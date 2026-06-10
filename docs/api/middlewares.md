# Middlewares API

Este documento descreve os quatro middlewares obrigatorios do backend Express.

## auth_middleware

Arquivo:

```txt
backend/src/middlewares/auth_middleware.js
```

Responsabilidades:

- ler `Authorization: Bearer <token>`;
- validar o JWT com `JWT_SECRET`;
- consultar o usuario no MySQL;
- bloquear token ausente;
- bloquear token invalido ou expirado;
- bloquear usuario inexistente ou inativo;
- preencher `req.user` com usuario sanitizado, sem `password_hash`.

Rotas publicas de autenticacao nao usam esse middleware:

```txt
POST /api/auth/register
POST /api/auth/login
```

Rotas privadas usam esse middleware:

```txt
GET  /api/auth/me
POST /api/auth/logout
```

Erro sem token:

```json
{
  "success": false,
  "message": "Authentication token is required",
  "error": {
    "code": "AUTH_TOKEN_REQUIRED",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Erro com token invalido:

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": {
    "code": "INVALID_TOKEN",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Erro com usuario inativo:

```json
{
  "success": false,
  "message": "Authenticated user is inactive",
  "error": {
    "code": "USER_INACTIVE",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## log_middleware

Arquivo:

```txt
backend/src/middlewares/log_middleware.js
```

Responsabilidades:

- registrar cada request como `REQUEST_ACCESS`;
- funcionar para usuario autenticado e anonimo;
- calcular tempo de resposta em milissegundos;
- gravar no MongoDB por meio de `LogService` e `LogDAO`;
- nao bloquear a resposta se o log falhar.

Campos gravados:

```json
{
  "timestamp": "2026-06-09T12:00:00.000Z",
  "event_type": "REQUEST_ACCESS",
  "action": "GET /api/health",
  "user_id": 1,
  "username": "user@example.com",
  "method": "GET",
  "endpoint": "/api/health",
  "status_code": 200,
  "response_time_ms": 12,
  "ip": "::1",
  "user_agent": "Mozilla/5.0",
  "details": {}
}
```

Dados que nao devem ser gravados:

- senha;
- `password_hash`;
- header `Authorization`;
- token JWT completo;
- segredos de ambiente.

## error_middleware

Arquivo:

```txt
backend/src/middlewares/error_middleware.js
```

Responsabilidades:

- capturar excecoes globais;
- diferenciar erro controlado (`ERROR`) de excecao inesperada (`EXCEPTION`);
- retornar JSON padronizado ao frontend;
- registrar erro no MongoDB;
- salvar stack trace no log;
- nao expor stack trace ao frontend em producao.

Erro padronizado:

```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Log de excecao:

```json
{
  "event_type": "EXCEPTION",
  "method": "GET",
  "endpoint": "/api/example",
  "status_code": 500,
  "error": {
    "name": "Error",
    "message": "Unexpected failure"
  },
  "stack_trace": "Error: Unexpected failure..."
}
```

## validation_middleware

Arquivo:

```txt
backend/src/middlewares/validation_middleware.js
```

Responsabilidades:

- validar `body`, `params` e `query` antes do controller;
- usar schemas Joi reutilizaveis;
- remover campos desconhecidos;
- retornar erro `400` padronizado.

Uso:

```js
router.post(
  "/auth/login",
  validate({ body: loginSchema }),
  authController.login,
);
```

Erro de validacao:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "\"email\" must be a valid email"
      }
    ]
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## Testes

Os testes obrigatorios ficam em:

```txt
backend/tests/middlewares.test.js
```

Cenarios cobertos:

- rota privada sem token;
- rota privada com token invalido;
- rota privada com token valido;
- usuario inativo bloqueado;
- log de request gravado no MongoDB;
- erro global gravado no MongoDB com stack trace;
- body invalido retornando `400`.
