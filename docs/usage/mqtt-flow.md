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

## Fluxo de Sucesso

1. Simulador publica `DISPENSE_STARTED`.
2. Backend registra evento e muda venda para `DISPENSING`.
3. Simulador publica `DISPENSE_SUCCESS`.
4. Backend muda comando para `SUCCESS`.
5. Backend muda venda para `DISPENSED`.
6. Backend baixa estoque reservado definitivamente.

## Fluxo de Falha

1. Simulador publica `DISPENSE_FAILED`.
2. Backend muda comando para `FAILED`.
3. Backend muda venda para `FAILED`.
4. Backend libera reserva de estoque.
5. Backend estorna saldo na wallet.
6. Backend cria `wallet_transactions` `REFUND`.
7. Backend muda venda para `REFUNDED`.

O processamento e idempotente: repetir o mesmo sucesso nao baixa estoque duas vezes, e repetir a mesma falha nao estorna duas vezes.

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
- `HEARTBEAT`;
- `DISPENSE_STARTED`;
- `DISPENSE_SUCCESS`;
- `DISPENSE_FAILED`;
- idempotencia de sucesso duplicado;
- idempotencia de falha duplicada;
- estorno unico.
