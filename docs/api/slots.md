# Slots API

Slots representam as posicoes fisicas de uma maquina. Cada slot pertence a uma maquina e armazena configuracao de motor e sensor.

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
  "machine_id": 1,
  "code": "A1",
  "motor_id": 1,
  "sensor_column_id": 1,
  "is_enabled": true,
  "created_at": "2026-06-10T12:00:00.000Z",
  "updated_at": "2026-06-10T12:00:00.000Z"
}
```

## GET /machines/:machineId/slots

Lista os slots de uma maquina.

Response `200`:

```json
{
  "success": true,
  "message": "Slots listed",
  "data": {
    "slots": [
      {
        "id": 1,
        "machine_id": 1,
        "code": "A1",
        "motor_id": 1,
        "sensor_column_id": 1,
        "is_enabled": true
      }
    ]
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## POST /machines/:machineId/slots

Cria slot em uma maquina existente.

Request:

```json
{
  "code": "B1",
  "motor_id": 2,
  "sensor_column_id": 2,
  "is_enabled": true
}
```

Regras:

- `machineId` deve existir;
- `code` deve ser unico dentro da maquina;
- `motor_id` deve ser unico dentro da maquina;
- `motor_id` e `sensor_column_id` devem ser positivos.

## PUT /slots/:id

Atualiza configuracao do slot.

Request:

```json
{
  "code": "B2",
  "motor_id": 3,
  "sensor_column_id": 3,
  "is_enabled": true
}
```

## DELETE /slots/:id

Desativa o slot com soft delete operacional (`is_enabled = false`).

## Logs MongoDB

Operacoes administrativas registram:

- `CREATE` com `table = "slots"`;
- `UPDATE` com `before`, `after` e campos alterados;
- `DELETE` com o slot antes e depois da desativacao.
