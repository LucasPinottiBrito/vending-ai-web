# MySQL Schema

O MySQL e o banco principal da plataforma. Ele armazena entidades de negocio: usuarios, carteiras, maquinas, slots, produtos, inventario, vendas, itens de venda, pagamentos, transacoes de carteira, comandos de dispensa e eventos operacionais da maquina.

Logs de sistema nao entram no MySQL. Eles devem ser gravados no MongoDB.

## Padrao de Chaves

Todas as tabelas usam `BIGINT UNSIGNED AUTO_INCREMENT` como PK. A escolha evita misturar padroes de identificadores, facilita demonstracao dos relacionamentos e simplifica os seeds.

Todas as tabelas principais possuem `created_at` e `updated_at`. Tabelas de historico pontual, como `sale_items` e `wallet_transactions`, registram ao menos `created_at`.

## Tabelas

### users

Armazena contas locais para login JWT futuro.

- PK: `id`
- Unique: `email`
- Campos relevantes: `name`, `email`, `password_hash`, `role`, `is_active`
- Regra: `role` aceita `USER`, `ADMIN` ou `OPERATOR`

### wallets

Armazena saldo interno dos usuarios.

- PK: `id`
- FK: `user_id -> users.id`
- Unique: `user_id`, garantindo uma carteira por usuario
- Regra: `balance_cents >= 0`

### machines

Representa uma vending machine fisica.

- PK: `id`
- Unique: `slug`
- Campos relevantes: `name`, `location`, `status`, `mqtt_base_topic`, `last_seen_at`
- Regra: `status` aceita `ONLINE`, `OFFLINE`, `MAINTENANCE` ou `ERROR`

### slots

Representa posicoes fisicas da maquina.

- PK: `id`
- FK: `machine_id -> machines.id`
- Unique: `(machine_id, code)` e `(machine_id, motor_id)`
- Regra: `motor_id` e `sensor_column_id` devem ser positivos

### products

Armazena catalogo de produtos.

- PK: `id`
- Unique: `sku`
- Campos relevantes: `name`, `description`, `category`, `price_cents`, `image_path`
- Regra: `price_cents >= 0`

### inventory

Liga um produto a um slot de uma maquina.

- PK: `id`
- FKs: `machine_id -> machines.id`, `(machine_id, slot_id) -> slots(machine_id, id)`, `product_id -> products.id`
- Unique: `slot_id`, mantendo um produto por slot no MVP
- Regras: quantidades nao negativas e `quantity_reserved <= quantity_available`

### sales

Registra vendas autorizadas pelo backend.

- PK: `id`
- FKs: `user_id -> users.id`, `machine_id -> machines.id`
- Status: `CREATED`, `AUTHORIZED`, `DISPENSING`, `DISPENSED`, `FAILED`, `REFUNDED`
- Regra: `total_cents >= 0`

### sale_items

Tabela intermediaria entre `sales` e `products`.

- PK: `id`
- FKs: `sale_id -> sales.id`, `product_id -> products.id`, `slot_id -> slots.id`
- Implementa N:N entre vendas e produtos
- Regra MVP: normalmente uma venda tera um item, mas a estrutura aceita evolucao para multiplos itens

### payments

Registra recargas mockadas da carteira.

- PK: `id`
- FK: `user_id -> users.id`
- Campos financeiros em centavos: `amount_cents`
- Status: `PENDING`, `PAID`, `EXPIRED`, `FAILED`, `CANCELED`

### wallet_transactions

Historico de creditos, debitos, reembolsos e ajustes.

- PK: `id`
- FKs: `wallet_id -> wallets.id`, `user_id -> users.id`, `sale_id -> sales.id`, `payment_id -> payments.id`
- Tipos: `CREDIT`, `DEBIT`, `REFUND`, `ADJUSTMENT`
- Regra: `amount_cents > 0`

### dispense_commands

Registra comandos de dispensa enviados ou preparados para MQTT.

- PK: `id`
- Unique: `command_uuid`
- FKs: `sale_id -> sales.id`, `machine_id -> machines.id`, `product_id -> products.id`, `slot_id -> slots.id`
- Status: `PENDING`, `PUBLISHED`, `ACKED`, `SUCCESS`, `FAILED`, `EXPIRED`
- Guarda `payload_json` para auditoria tecnica do comando

### machine_events

Registra eventos operacionais da maquina, como heartbeat e resultado de dispensa.

- PK: `id`
- FKs: `machine_id -> machines.id`, `sale_id -> sales.id`, `dispense_command_id -> dispense_commands.id`
- Tipos: `HEARTBEAT`, `DISPENSE_STARTED`, `SENSOR_TRIGGERED`, `DISPENSE_RETRY`, `DISPENSE_SUCCESS`, `DISPENSE_FAILED`, `MOTOR_ERROR`, `MACHINE_ERROR`, `INVALID_JSON`, `UNKNOWN_COMMAND_TYPE`, `INVALID_COMMAND`, `MACHINE_BUSY`, `UNKNOWN_MOTOR_ID`, `UNKNOWN_SENSOR_COLUMN_ID`, `UNSUPPORTED_QUANTITY`, `COMMAND_DUPLICATED`, `PRODUCT_NOT_DETECTED`, `INTERNAL_ERROR`

## Relacionamentos 1:N

O schema possui varios relacionamentos 1:N:

- `users -> sales`
- `users -> payments`
- `users -> wallet_transactions`
- `machines -> slots`
- `machines -> sales`
- `sales -> dispense_commands`
- `wallets -> wallet_transactions`

Esses relacionamentos cumprem o requisito academico de tabelas relacionadas com integridade referencial.

## Relacionamento N:N

O relacionamento N:N obrigatorio e:

```txt
sales N:N products via sale_items
```

Mesmo que o MVP venda apenas um produto por compra, `sale_items` preserva a estrutura correta para carrinho futuro e demonstra a tabela intermediaria exigida.

## Integridade Referencial

As FKs usam `ON UPDATE CASCADE` para manter consistencia caso uma PK seja alterada. Delecoes que poderiam corromper historico usam `ON DELETE RESTRICT`, especialmente em usuarios, produtos, vendas, maquinas e slots.

Campos opcionais de referencia historica em `wallet_transactions` e `machine_events` usam `ON DELETE SET NULL` para manter o registro operacional quando a entidade opcional for removida em ambiente administrativo.

## Regras de Estoque

O estoque vendavel e calculado por:

```sql
quantity_available - quantity_reserved
```

Regras no banco:

- `quantity_available >= 0`
- `quantity_reserved >= 0`
- `quantity_reserved <= quantity_available`
- um slot possui um registro de inventario no MVP

Na compra autorizada, o backend deve aumentar `quantity_reserved`. Na dispensa com sucesso, deve reduzir `quantity_available` e `quantity_reserved`. Na falha, deve liberar `quantity_reserved`.

## Regras de Saldo

Valores financeiros sao armazenados em centavos:

- `wallets.balance_cents`
- `products.price_cents`
- `sales.total_cents`
- `sale_items.unit_price_cents`
- `sale_items.total_cents`
- `payments.amount_cents`
- `wallet_transactions.amount_cents`

Regras no banco:

- saldo da carteira nao pode ser negativo;
- valores de venda/preco nao podem ser negativos;
- transacoes de carteira devem ter valor positivo.

O backend deve executar compra, debito, reserva de estoque, venda, item de venda e comando de dispensa dentro de transacao MySQL.
