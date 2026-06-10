# Sales API

Fluxo de compra com saldo interno. O backend e a fonte da verdade para preco, saldo, estoque, venda e comando de dispensa.

Base URL local:

```txt
http://localhost:4000/api
```

Todas as rotas exigem JWT:

```txt
Authorization: Bearer <token>
```

## Estados

Venda:

```txt
CREATED
AUTHORIZED
DISPENSING
DISPENSED
FAILED
REFUNDED
```

Comando de dispensa:

```txt
PENDING
PUBLISHED
ACKED
SUCCESS
FAILED
EXPIRED
```

## POST /sales/checkout

Compra um produto usando saldo da carteira.

Headers recomendados:

```txt
Authorization: Bearer <token>
Idempotency-Key: checkout-uuid-ou-chave-do-cliente
```

Request:

```json
{
  "machine_id": 1,
  "slot_id": 2,
  "product_id": 5
}
```

O frontend nao envia preco. O backend busca `products.price_cents` no MySQL.

Response `201`:

```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "data": {
    "sale": {
      "id": 10,
      "user_id": 7,
      "machine_id": 1,
      "status": "AUTHORIZED",
      "payment_method": "WALLET",
      "total_cents": 700
    },
    "sale_item": {
      "id": 11,
      "sale_id": 10,
      "product_id": 5,
      "slot_id": 2,
      "quantity": 1,
      "unit_price_cents": 700,
      "total_cents": 700
    },
    "wallet": {
      "id": 3,
      "balance_cents": 1300
    },
    "wallet_transaction": {
      "id": 20,
      "sale_id": 10,
      "type": "DEBIT",
      "amount_cents": 700,
      "status": "COMPLETED",
      "reference_type": "SALE"
    },
    "inventory": {
      "id": 8,
      "quantity_available": 3,
      "quantity_reserved": 1,
      "available_for_sale": 2
    },
    "dispense_command": {
      "id": 15,
      "sale_id": 10,
      "status": "PUBLISHED",
      "mqtt_topic": "vending/1/actions"
    },
    "idempotent": false
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Resposta idempotente `200` para a mesma `Idempotency-Key`:

```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "data": {
    "sale": {
      "id": 10,
      "status": "AUTHORIZED"
    },
    "items": [],
    "dispense_commands": [],
    "wallet_transactions": [],
    "idempotent": true
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## GET /sales

Lista vendas do usuario autenticado.

Query params:

- `status`: filtra por estado da venda.
- `limit`: padrao `100`.
- `user_id`: aceito para `ADMIN`; usuario comum sempre ve apenas as proprias vendas.

## GET /sales/:id

Detalha uma venda, incluindo itens, transacoes e comandos.

Response `200`:

```json
{
  "success": true,
  "message": "Sale found",
  "data": {
    "sale": {
      "id": 10,
      "status": "AUTHORIZED",
      "total_cents": 700
    },
    "items": [
      {
        "product_id": 5,
        "quantity": 1,
        "unit_price_cents": 700
      }
    ],
    "dispense_commands": [
      {
        "status": "PENDING"
      }
    ],
    "wallet_transactions": [
      {
        "type": "DEBIT",
        "amount_cents": 700
      }
    ]
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Usuario comum nao acessa venda de outro usuario. `ADMIN` pode consultar qualquer venda.

## GET /users/me/purchases

Alias para historico de compras do usuario autenticado.

Response `200`:

```json
{
  "success": true,
  "message": "Purchases listed",
  "data": {
    "purchases": [
      {
        "id": 10,
        "status": "AUTHORIZED",
        "total_cents": 700
      }
    ]
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## Erros

Saldo insuficiente:

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "error": {
    "code": "INSUFFICIENT_BALANCE"
  }
}
```

Estoque indisponivel:

```json
{
  "success": false,
  "message": "Product is out of stock",
  "error": {
    "code": "OUT_OF_STOCK"
  }
}
```

Maquina offline, inativa ou em manutencao:

```json
{
  "success": false,
  "message": "Machine is not available for purchases",
  "error": {
    "code": "MACHINE_NOT_AVAILABLE"
  }
}
```

## Logs MongoDB

Checkout bem-sucedido registra:

- `UPDATE` em `wallets`;
- `CREATE` em `wallet_transactions`;
- `UPDATE` em `inventory`;
- `CREATE` em `sales`;
- `CREATE` em `sale_items`;
- `CREATE` em `dispense_commands`.
