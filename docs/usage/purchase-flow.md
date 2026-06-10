# Purchase Flow

Este documento descreve o fluxo de compra com saldo interno.

## Objetivo

Permitir que um usuario autenticado compre um produto de uma maquina usando saldo da carteira. O backend decide preco, saldo, estoque, reserva e comando de dispensa.

## Entrada

Endpoint:

```txt
POST /api/sales/checkout
```

Payload:

```json
{
  "machine_id": 1,
  "slot_id": 2,
  "product_id": 5
}
```

Header recomendado:

```txt
Idempotency-Key: uma-chave-unica-por-tentativa
```

## Fluxo Transacional

O backend executa dentro de uma transacao MySQL:

1. Valida usuario autenticado e ativo pelo `auth_middleware`.
2. Busca inventory por `machine_id`, `slot_id` e `product_id` com lock.
3. Valida maquina ativa e `ONLINE`.
4. Valida slot habilitado.
5. Valida produto ativo.
6. Busca preco real em `products.price_cents`.
7. Calcula estoque disponivel: `quantity_available - quantity_reserved`.
8. Busca wallet do usuario com lock.
9. Valida saldo suficiente.
10. Debita `wallets.balance_cents`.
11. Incrementa `inventory.quantity_reserved`.
12. Cria `sales` com status `AUTHORIZED`.
13. Cria `wallet_transactions` com tipo `DEBIT`.
14. Cria `sale_items`.
15. Cria `dispense_commands` com status `PENDING`.
16. Confirma a transacao.
17. Publica o comando em `vending/{machine_id}/actions`.
18. Atualiza `dispense_commands.status` para `PUBLISHED`.
19. Registra logs MongoDB das alteracoes.

Se qualquer etapa falhar antes do commit, a transacao e revertida e nao deve haver saldo debitado, reserva de estoque, venda, item ou comando parcial.

## Idempotencia

Para prevenir duplo clique, o cliente deve enviar `Idempotency-Key`.

O backend deriva o `dispense_commands.command_uuid` dessa chave e do usuario autenticado. Se a mesma chave for recebida novamente, a API retorna a venda ja criada com `idempotent = true` e nao debita saldo novamente.

## Regras de Bloqueio

Saldo insuficiente:

- retorna `402 INSUFFICIENT_BALANCE`;
- nao cria venda;
- nao reserva estoque;
- nao cria comando.

Sem estoque:

- retorna `409 OUT_OF_STOCK`;
- nao debita saldo;
- nao cria venda.

Maquina offline, inativa ou em manutencao:

- retorna `409 MACHINE_NOT_AVAILABLE`;
- nao debita saldo;
- nao reserva estoque.

## Estados Iniciais Criados

Venda:

```txt
AUTHORIZED
```

Comando criado inicialmente:

```txt
PENDING
```

Depois da publicacao MQTT:

```txt
PUBLISHED
```

As transicoes para `SUCCESS`, `FAILED` e reembolso ficam para o modulo de eventos/dispensa.

## Auditoria

MongoDB registra:

- debito de wallet;
- transacao de carteira;
- reserva de inventory;
- venda;
- item de venda;
- comando de dispensa;
- publicacao MQTT do comando.
