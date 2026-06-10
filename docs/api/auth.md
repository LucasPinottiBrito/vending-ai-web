# Auth API

Autenticacao local do backend usando email, senha com bcrypt e JWT proprio. Nao usa Supabase Auth, Firebase Auth, Google Login ou outro provedor externo.

Base URL local:

```txt
http://localhost:4000/api
```

## POST /auth/register

Cria um usuario com role `USER`, gera hash da senha e cria uma wallet com `balance_cents = 0`.

Request:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "StrongPass123"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 10,
      "name": "Maria Silva",
      "email": "maria@example.com",
      "role": "USER",
      "is_active": true,
      "created_at": "2026-06-09T12:00:00.000Z",
      "updated_at": "2026-06-09T12:00:00.000Z"
    },
    "token": "jwt.token.value"
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Erro de email duplicado `409`:

```json
{
  "success": false,
  "message": "Email already registered",
  "error": {
    "code": "EMAIL_ALREADY_REGISTERED",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## POST /auth/login

Valida email e senha. Em sucesso, retorna JWT e registra `LOGIN_SUCCESS` no MongoDB. Em falha, registra `LOGIN_FAILURE`.

Request:

```json
{
  "email": "maria@example.com",
  "password": "StrongPass123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 10,
      "name": "Maria Silva",
      "email": "maria@example.com",
      "role": "USER",
      "is_active": true,
      "created_at": "2026-06-09T12:00:00.000Z",
      "updated_at": "2026-06-09T12:00:00.000Z"
    },
    "token": "jwt.token.value"
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Erro de credenciais `401`:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "details": null
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## GET /auth/me

Retorna o usuario autenticado. Exige token Bearer.

Header:

```txt
Authorization: Bearer jwt.token.value
```

Response `200`:

```json
{
  "success": true,
  "message": "Authenticated user",
  "data": {
    "user": {
      "id": 10,
      "name": "Maria Silva",
      "email": "maria@example.com",
      "role": "USER",
      "is_active": true,
      "created_at": "2026-06-09T12:00:00.000Z",
      "updated_at": "2026-06-09T12:00:00.000Z"
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Sem token `401`:

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

## POST /auth/logout

Registra `LOGOUT` no MongoDB. Como JWT e stateless nesta fase, o logout nao invalida tokens emitidos.

Header:

```txt
Authorization: Bearer jwt.token.value
```

Response `200`:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "logged_out": true
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## Logs MongoDB

Eventos gravados na colecao `vending_logs.logs`:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `LOGOUT`

Os logs incluem endpoint, metodo, status HTTP, IP, user agent e usuario quando conhecido. Senhas, hash de senha e token JWT completo nunca devem ser gravados.
