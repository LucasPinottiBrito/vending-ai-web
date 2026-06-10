# MySQL Schema

Este diretorio contem os scripts do banco relacional principal da plataforma.

## Arquivos

- `schema.sql`: cria o banco `vending_machine`, tabelas, PKs, FKs, indices e constraints.
- `seed.sql`: insere dados iniciais de demonstracao.

## Padrao de IDs

Todas as tabelas usam `BIGINT UNSIGNED AUTO_INCREMENT` como chave primaria. Esse padrao foi escolhido por ser simples para demonstracao academica, eficiente em joins MySQL e facil de referenciar nos seeds.

## Tabelas criadas

- `users`
- `wallets`
- `machines`
- `slots`
- `products`
- `inventory`
- `sales`
- `sale_items`
- `payments`
- `wallet_transactions`
- `dispense_commands`
- `machine_events`

`machine_events` guarda eventos operacionais da maquina IoT. Logs de sistema e requisicoes continuam fora do MySQL e devem ser armazenados no MongoDB.

## Relacionamentos principais

- `users` 1:1 `wallets`
- `users` 1:N `sales`
- `users` 1:N `payments`
- `users` 1:N `wallet_transactions`
- `machines` 1:N `slots`
- `machines` 1:N `sales`
- `slots` 1:1 `inventory` no MVP
- `products` 1:N `inventory`
- `sales` N:N `products` por meio de `sale_items`
- `sales` 1:N `dispense_commands`
- `wallets` 1:N `wallet_transactions`

## Seeds de demonstracao

Os seeds incluem:

- admin `admin@example.com`
- cliente `cliente@example.com`
- uma maquina com slug `hall-principal`
- quatro slots (`A1`, `A2`, `B1`, `B2`)
- quatro produtos
- inventario inicial
- carteira do cliente com saldo em centavos
- pagamento mock de recarga
- tres vendas de exemplo
- comandos de dispensa e eventos IoT de exemplo

Senhas de demonstracao:

- admin: `Admin@123`
- cliente: `Cliente@123`

As senhas acima aparecem apenas nesta documentacao. O banco armazena hashes bcrypt.

## Inicializacao via Docker

O `docker-compose.yml` monta os scripts em:

```txt
/docker-entrypoint-initdb.d/01_schema.sql
/docker-entrypoint-initdb.d/02_seed.sql
```

Esses scripts rodam automaticamente apenas quando o volume `mysql_data` ainda esta vazio. Para reinicializar o banco:

```bash
docker compose down -v
docker compose up --build -d mysql
```

## Consultas uteis

Listar produtos:

```sql
SELECT id, sku, name, price_cents, is_active
FROM products
ORDER BY id;
```

Listar inventario por maquina:

```sql
SELECT
  m.name AS machine_name,
  s.code AS slot_code,
  p.name AS product_name,
  i.quantity_available,
  i.quantity_reserved,
  (i.quantity_available - i.quantity_reserved) AS sellable_quantity
FROM inventory i
JOIN machines m ON m.id = i.machine_id
JOIN slots s ON s.id = i.slot_id
JOIN products p ON p.id = i.product_id
WHERE m.slug = 'hall-principal'
ORDER BY s.code;
```

Listar vendas com itens:

```sql
SELECT
  sa.id AS sale_id,
  sa.status,
  u.email AS user_email,
  p.name AS product_name,
  si.quantity,
  si.total_cents
FROM sales sa
JOIN users u ON u.id = sa.user_id
JOIN sale_items si ON si.sale_id = sa.id
JOIN products p ON p.id = si.product_id
ORDER BY sa.id;
```

Listar carteira do usuario:

```sql
SELECT u.email, w.balance_cents
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE u.email = 'cliente@example.com';
```
