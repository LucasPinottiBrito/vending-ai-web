# Wallet and Mock Payments API

Carteira interna e pagamentos mockados da Vending Machine Web Platform. Dados de negocio ficam em MySQL; logs operacionais ficam em MongoDB.

Base URL local:

```txt
http://localhost:4000/api
```

Todas as rotas exigem JWT:

```txt
Authorization: Bearer <token>
```

## Modelos

Wallet:

```json
{
  "id": 1,
  "user_id": 10,
  "balance_cents": 2500,
  "created_at": "2026-06-10T12:00:00.000Z",
  "updated_at": "2026-06-10T12:00:00.000Z"
}
```

Payment:

```json
{
  "id": 5,
  "user_id": 10,
  "type": "MOCK_TOPUP",
  "provider": "MOCK",
  "provider_payment_id": "mock-10-uuid",
  "amount_cents": 2500,
  "status": "PENDING",
  "mock_qr_code": "mock://topup/mock-10-uuid",
  "mock_copy_paste": "mock-10-uuid",
  "expires_at": "2026-06-10T12:15:00.000Z",
  "paid_at": null
}
```

Wallet transaction:

```json
{
  "id": 20,
  "wallet_id": 1,
  "user_id": 10,
  "payment_id": 5,
  "type": "CREDIT",
  "amount_cents": 2500,
  "status": "COMPLETED",
  "reference_type": "MOCK_TOPUP",
  "reference_id": 5,
  "description": "Mock wallet top-up"
}
```

Valores monetarios usam centavos.

## GET /wallet/balance

Retorna saldo da carteira do usuario autenticado.

Response `200`:

```json
{
  "success": true,
  "message": "Wallet balance found",
  "data": {
    "wallet": {
      "id": 1,
      "user_id": 10,
      "balance_cents": 0
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## GET /wallet/transactions

Lista movimentacoes da carteira do usuario autenticado.

Query params:

- `limit`: padrao `100`, maximo `200`.

Response `200`:

```json
{
  "success": true,
  "message": "Wallet transactions listed",
  "data": {
    "transactions": [
      {
        "id": 20,
        "wallet_id": 1,
        "payment_id": 5,
        "type": "CREDIT",
        "amount_cents": 2500,
        "status": "COMPLETED",
        "reference_type": "MOCK_TOPUP"
      }
    ]
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## POST /wallet/topup/mock

Cria uma recarga mockada. Esta rota ainda nao credita saldo; ela cria um `payment` pendente.

Request:

```json
{
  "amount_cents": 2500
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Mock top-up created successfully",
  "data": {
    "payment": {
      "id": 5,
      "user_id": 10,
      "type": "MOCK_TOPUP",
      "provider": "MOCK",
      "amount_cents": 2500,
      "status": "PENDING",
      "mock_copy_paste": "mock-10-uuid"
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Validações:

- `amount_cents` e obrigatorio;
- deve ser inteiro positivo;
- payload invalido retorna `400 VALIDATION_ERROR`.

## GET /payments/:id

Consulta pagamento. Usuario comum acessa apenas os proprios pagamentos; `ADMIN` pode consultar qualquer pagamento.

Response `200`:

```json
{
  "success": true,
  "message": "Payment found",
  "data": {
    "payment": {
      "id": 5,
      "amount_cents": 2500,
      "status": "PENDING"
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## POST /payments/:id/confirm-mock

Confirma pagamento mockado pendente.

Primeira confirmação:

```json
{
  "success": true,
  "message": "Mock payment confirmed successfully",
  "data": {
    "payment": {
      "id": 5,
      "status": "PAID",
      "amount_cents": 2500
    },
    "wallet": {
      "id": 1,
      "balance_cents": 2500
    },
    "transaction": {
      "id": 20,
      "payment_id": 5,
      "type": "CREDIT",
      "amount_cents": 2500,
      "status": "COMPLETED"
    },
    "idempotent": false
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Confirmação repetida:

```json
{
  "success": true,
  "message": "Mock payment confirmed successfully",
  "data": {
    "payment": {
      "id": 5,
      "status": "PAID"
    },
    "wallet": {
      "balance_cents": 2500
    },
    "transaction": {
      "payment_id": 5
    },
    "idempotent": true
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Regras:

- somente `MOCK_TOPUP` com provider `MOCK` pode ser confirmado;
- pagamento `PENDING` vira `PAID`;
- carteira e creditada uma unica vez;
- uma `wallet_transactions` do tipo `CREDIT` e criada;
- repetir a confirmacao nao duplica saldo nem transacao.

## Logs MongoDB

Eventos registrados em `vending_logs.logs`:

- `CREATE` com `table = "payments"` ao criar recarga;
- `UPDATE` com `table = "payments"` ao confirmar pagamento;
- `UPDATE` com `table = "wallets"` ao creditar saldo;
- `CREATE` com `table = "wallet_transactions"` ao registrar movimentacao.
