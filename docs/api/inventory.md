# Inventory API

Inventory liga uma maquina, um slot e um produto. No MVP, um slot possui um unico registro de estoque.

Base URL local:

```txt
http://localhost:4000/api
```

Todas as rotas exigem token JWT de usuario `ADMIN`.

```txt
Authorization: Bearer <admin-token>
```

## Modelo

```json
{
  "id": 1,
  "inventory_id": 1,
  "machine_id": 1,
  "slot_id": 2,
  "product_id": 5,
  "quantity_available": 10,
  "quantity_reserved": 2,
  "min_quantity_alert": 1,
  "available_for_sale": 8,
  "slot_code": "A1",
  "motor_id": 1,
  "sensor_column_id": 1,
  "product_sku": "AGUA-500ML",
  "product_name": "Agua Mineral 500ml",
  "price_cents": 500
}
```

`available_for_sale` sempre e calculado pelo backend:

```txt
quantity_available - quantity_reserved
```

## GET /inventory

Lista estoque.

Query params:

- `machine_id`: filtra por maquina.
- `product_id`: filtra por produto.
- `low_stock`: `true` para itens abaixo ou iguais ao minimo.
- `limit`: padrao `100`.

## GET /machines/:machineId/inventory

Lista estoque de uma maquina especifica.

## GET /inventory/:id

Busca um registro de estoque por id.

## POST /inventory

Cria estoque.

Request:

```json
{
  "machine_id": 1,
  "slot_id": 2,
  "product_id": 5,
  "quantity_available": 10,
  "quantity_reserved": 0,
  "min_quantity_alert": 2
}
```

Regras:

- maquina deve existir;
- slot deve existir;
- slot deve pertencer a maquina informada;
- produto deve existir e estar ativo;
- slot nao pode ter outro inventory no MVP;
- quantidades nao podem ser negativas;
- `quantity_reserved` nao pode ser maior que `quantity_available`.

## PUT /inventory/:id

Atualiza produto ou quantidades do inventory.

Request:

```json
{
  "quantity_available": 12,
  "quantity_reserved": 1,
  "min_quantity_alert": 2
}
```

## POST /inventory/:id/adjust

Ajusta quantidades por delta. Deltas podem ser positivos ou negativos, desde que o resultado final nao fique negativo e reservado nao exceda disponivel.

Request:

```json
{
  "quantity_available_delta": 5,
  "reason": "Reposicao manual"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Inventory adjusted successfully",
  "data": {
    "inventory": {
      "id": 1,
      "quantity_available": 15,
      "quantity_reserved": 1,
      "available_for_sale": 14
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## Validacao

Payload invalido retorna `400 VALIDATION_ERROR`. Relações inexistentes retornam:

- `MACHINE_NOT_FOUND`;
- `SLOT_NOT_FOUND`;
- `PRODUCT_NOT_FOUND`.

## Logs MongoDB

Operacoes administrativas registram:

- `CREATE` com `table = "inventory"`;
- `UPDATE` com `before`, `after`, campos alterados ou motivo do ajuste.
