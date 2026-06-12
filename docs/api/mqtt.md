# MQTT API and Contract

Integracao MQTT do backend com ESP32-S3 ou simulador. O backend usa `mqtt.js` e o broker externo HiveMQ publico.

## Broker

Padrao de ambiente:

```env
MQTT_HOST=broker.hivemq.com
MQTT_PORT=1883
MQTT_USE_TLS=false
```

## Topicos

```txt
vending/{machine_id}/actions
vending/{machine_id}/events
vending/{machine_id}/status
```

- `actions`: backend publica comandos.
- `events`: ESP32-S3 ou simulador publica eventos.
- `status`: ESP32-S3 ou simulador publica heartbeat.

## Comando DISPENSE

Publicado pelo backend em:

```txt
vending/{machine_id}/actions
```

Payload:

```json
{
  "type": "DISPENSE",
  "command_id": 1,
  "sale_id": 1,
  "machine_id": 1,
  "product_id": 1,
  "slot_id": 1,
  "slot_code": "A1",
  "motor_id": 1,
  "sensor_column_id": 1,
  "quantity": 1,
  "attempts_allowed": 2,
  "timeout_ms_per_attempt": 10000,
  "issued_at": "2026-06-08T12:00:00.000Z"
}
```

Regras de publicacao:

- `qos: 1`;
- `retain: false`;
- payload JSON menor que `1024` bytes;
- `command_id` numerico igual a `dispense_commands.id`;
- sem campo `expires_at` no payload publicado;
- para a ESP fisica atual da maquina `1`, somente `motor_id=1/sensor_column_id=1` e `motor_id=2/sensor_column_id=2`.

Ao publicar ou enfileirar a publicacao no cliente `mqtt.js`, o backend atualiza `dispense_commands.status` para `PUBLISHED`. Se a conexao com o broker ainda estiver sendo estabelecida, a chamada HTTP nao fica bloqueada aguardando indefinidamente o callback do broker.

## Eventos Recebidos

Eventos esperados:

```txt
HEARTBEAT
DISPENSE_STARTED
SENSOR_TRIGGERED
DISPENSE_RETRY
DISPENSE_SUCCESS
DISPENSE_FAILED
MOTOR_ERROR
MACHINE_ERROR
INVALID_JSON
UNKNOWN_COMMAND_TYPE
INVALID_COMMAND
MACHINE_BUSY
UNKNOWN_MOTOR_ID
UNKNOWN_SENSOR_COLUMN_ID
UNSUPPORTED_QUANTITY
COMMAND_DUPLICATED
PRODUCT_NOT_DETECTED
INTERNAL_ERROR
```

Payload minimo recomendado:

```json
{
  "type": "DISPENSE_SUCCESS",
  "machine_id": 1,
  "command_id": 1,
  "sale_id": 1
}
```

## HEARTBEAT

Publicado em:

```txt
vending/{machine_id}/status
```

Efeito:

- cria registro em `machine_events`;
- atualiza `machines.last_seen_at`;
- marca maquina como `ONLINE`.

Maquinas sem heartbeat por cerca de dois periodos, aproximadamente 65 a 75 segundos, podem ser marcadas como `OFFLINE`.

## DISPENSE_STARTED

Efeito:

- cria `machine_events`;
- se a venda estiver `AUTHORIZED`, muda para `DISPENSING`.

## DISPENSE_SUCCESS

Efeito idempotente:

- comando vira `SUCCESS`;
- venda vira `DISPENSED`;
- `inventory.quantity_available` diminui;
- `inventory.quantity_reserved` diminui;
- registra evento em MySQL e logs no MongoDB.

Se o mesmo sucesso chegar novamente, o backend registra o evento, mas nao baixa estoque de novo.

## SENSOR_TRIGGERED

Quando o evento informa `command_id` ou `sale_id`, ele tambem e tratado como confirmacao fisica de queda do produto:

- comando vira `SUCCESS`;
- venda vira `DISPENSED`;
- `inventory.quantity_available` diminui;
- `inventory.quantity_reserved` diminui.

Se a ESP tambem enviar `DISPENSE_SUCCESS` depois, o processamento continua idempotente e nao baixa estoque novamente.

## DISPENSE_FAILED

Efeito idempotente:

- comando vira `FAILED`;
- venda vira `FAILED`;
- reserva de estoque e liberada;
- saldo e estornado;
- venda vira `REFUNDED`;
- cria `wallet_transactions` do tipo `REFUND`;
- registra evento em MySQL e logs no MongoDB.

Se a mesma falha chegar novamente, o backend registra o evento, mas nao duplica estorno.

## Rejeicoes da ESP32-S3

Eventos de rejeicao como `INVALID_COMMAND`, `UNKNOWN_MOTOR_ID`, `UNSUPPORTED_QUANTITY`, `MACHINE_BUSY` e `PRODUCT_NOT_DETECTED` sao registrados em `machine_events`.

Quando a rejeicao informa `command_id` ou `sale_id`, o backend trata como falha terminal de dispensacao: comando `FAILED`, venda `FAILED -> REFUNDED`, reserva liberada e wallet estornada de forma idempotente. Quando a rejeicao nao identifica comando ou venda, o backend apenas registra o evento/log para diagnostico.

## Logs

Eventos MQTT geram logs no MongoDB para:

- `machine_events`;
- `machines` no heartbeat;
- `dispense_commands`;
- `sales`;
- `inventory`;
- `wallets`;
- `wallet_transactions`.
