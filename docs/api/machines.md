# Machines API

CRUD de maquinas da vending machine. Dados ficam no MySQL e alteracoes administrativas geram logs no MongoDB.

Base URL local:

```txt
http://localhost:4000/api
```

## Modelo

```json
{
  "id": 1,
  "name": "Maquina Bloco A",
  "slug": "maquina-bloco-a",
  "location": "Bloco A",
  "status": "ONLINE",
  "mqtt_base_topic": "vending/1",
  "last_seen_at": null,
  "firmware_version": "1.0.0",
  "is_active": true,
  "can_sell": true,
  "created_at": "2026-06-10T12:00:00.000Z",
  "updated_at": "2026-06-10T12:00:00.000Z"
}
```

`can_sell` e verdadeiro somente quando a maquina esta ativa e com `status = ONLINE`.

## Rotas Publicas

### GET /machines

Lista maquinas.

Query params:

- `search`: busca por nome, slug ou local.
- `status`: `ONLINE`, `OFFLINE`, `MAINTENANCE`, `ERROR` ou `all`.
- `active`: `active`, `inactive` ou `all`.
- `limit`: padrao `100`.

### GET /machines/:id

Busca uma maquina por id.

### GET /machines/slug/:slug

Busca uma maquina pelo slug usado em QR Code.

### GET /machines/slug/:slug/catalog

Retorna o catalogo vendavel da maquina.

Response `200`:

```json
{
  "success": true,
  "message": "Machine catalog found",
  "data": {
    "machine": {
      "id": 1,
      "slug": "maquina-bloco-a",
      "status": "ONLINE",
      "can_sell": true
    },
    "items": [
      {
        "id": 10,
        "inventory_id": 10,
        "slot_id": 2,
        "slot_code": "A1",
        "motor_id": 1,
        "sensor_column_id": 1,
        "product_id": 5,
        "product_name": "Agua Mineral 500ml",
        "price_cents": 500,
        "quantity_available": 8,
        "quantity_reserved": 1,
        "available_for_sale": 7
      }
    ]
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## Rotas Administrativas

Todas exigem:

```txt
Authorization: Bearer <admin-token>
```

### POST /machines

Cria maquina. Pode criar slots dinamicamente se `slots` for enviado.

```json
{
  "slug": "maquina-bloco-a",
  "name": "Maquina Bloco A",
  "location": "Bloco A",
  "status": "ONLINE",
  "slots": [
    {
      "code": "A1",
      "motor_id": 1,
      "sensor_column_id": 1
    }
  ]
}
```

Efeitos:

- insere `machines`;
- insere `slots` quando enviados;
- registra `CREATE` no MongoDB para a maquina e para cada slot criado.

### PUT /machines/:id

Atualiza dados da maquina.

### DELETE /machines/:id

Desativa a maquina com soft delete (`is_active = false`).

## Validacao

- `slug` deve ser unico e conter letras minusculas, numeros e hifens.
- `status` deve ser `ONLINE`, `OFFLINE`, `MAINTENANCE` ou `ERROR`.
- usuario sem papel `ADMIN` recebe `403 FORBIDDEN`.

## Logs MongoDB

Eventos registrados em `vending_logs.logs`:

- `CREATE` com `table = "machines"`;
- `UPDATE` com `before`, `after` e campos alterados;
- `DELETE` com o registro antes e depois da desativacao.
