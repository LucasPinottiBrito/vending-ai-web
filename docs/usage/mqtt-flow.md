# MQTT Flow

Este guia descreve como validar a integracao MQTT sem ESP32-S3 fisico.

## Servicos Envolvidos

- `MqttService`: conexao com broker, publish e subscribe.
- `DispenseCommandService`: publica comandos e muda `PENDING -> PUBLISHED`.
- `MachineEventService`: processa mensagens de status/eventos.

## Fluxo de Compra ate Publicacao

1. Usuario faz `POST /api/sales/checkout`.
2. Backend cria venda `AUTHORIZED`.
3. Backend cria `dispense_commands` `PENDING`.
4. Backend publica payload `DISPENSE` em `vending/{machine_id}/actions`.
5. Backend marca comando como `PUBLISHED`.

Se o cliente MQTT ainda nao estiver conectado ao broker, o backend enfileira a publicacao no `mqtt.js` e continua a resposta HTTP sem travar o checkout.

O publish usa `qos: 1` e `retain: false`. O payload enviado para a ESP32-S3 e menor que `1024` bytes, nao inclui `expires_at` e usa `command_id` numerico de `dispense_commands.id`.

Para a maquina fisica atual (`machine_id = 1`), apenas os pares `motor_id=1/sensor_column_id=1` e `motor_id=2/sensor_column_id=2` sao vendidos. Slots incompatíveis sao bloqueados no checkout antes de debitar wallet ou reservar estoque.

## Fluxo de Sucesso

1. Simulador publica `DISPENSE_STARTED`.
2. Backend registra evento e muda venda para `DISPENSING`.
3. Simulador publica `SENSOR_TRIGGERED` ou `DISPENSE_SUCCESS`.
4. Backend muda comando para `SUCCESS`.
5. Backend muda venda para `DISPENSED`.
6. Backend baixa estoque reservado definitivamente.

`SENSOR_TRIGGERED` e considerado confirmacao fisica de queda quando identifica `command_id` ou `sale_id`. Se `DISPENSE_SUCCESS` chegar depois, o backend nao baixa o estoque novamente.

## Fluxo de Falha

1. Simulador publica `DISPENSE_FAILED`.
2. Backend muda comando para `FAILED`.
3. Backend muda venda para `FAILED`.
4. Backend libera reserva de estoque.
5. Backend estorna saldo na wallet.
6. Backend cria `wallet_transactions` `REFUND`.
7. Backend muda venda para `REFUNDED`.

O processamento e idempotente: repetir o mesmo sucesso nao baixa estoque duas vezes, e repetir a mesma falha nao estorna duas vezes.

## Rejeicoes da ESP32-S3

A ESP pode publicar rejeicoes como:

```txt
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

Se o evento trouxer `command_id` ou `sale_id`, o backend trata a rejeicao como falha terminal: comando `FAILED`, reserva liberada, wallet estornada e venda `REFUNDED`. A repeticao do mesmo evento nao duplica o estorno. Se nao houver comando ou venda identificavel, o evento e registrado para diagnostico sem alterar vendas.

## Heartbeat

O simulador publica em:

```txt
vending/{machine_id}/status
```

Payload:

```json
{
  "type": "HEARTBEAT",
  "machine_id": 1
}
```

O backend atualiza `last_seen_at` e status `ONLINE`.

## Validacao Sem ESP Fisica

Os testes automatizados usam um client MQTT mockado para validar publish e chamam `MachineEventService.processEvent` para simular mensagens recebidas.

Comandos principais:

```bash
cd backend
npm test
```

Teste coberto:

- publish MQTT mockado;
- contrato ESP32-S3 do payload `DISPENSE`;
- `HEARTBEAT`;
- `DISPENSE_STARTED`;
- `DISPENSE_SUCCESS`;
- `DISPENSE_FAILED`;
- rejeicoes da ESP32-S3;
- idempotencia de sucesso duplicado;
- idempotencia de falha duplicada;
- estorno unico.
