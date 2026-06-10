# Fluxo de Checkout e Acompanhamento de Compra

Este documento descreve o processo de finalização de compra no frontend e o acompanhamento do status da venda.

## 1. Checkout (`/m/[slug]/checkout/[slotId]`)

O checkout é a etapa final antes da autorização da venda.

### Funcionalidades:
- **Resumo do Pedido**: Exibe o produto, preço formatado e informações da máquina.
- **Validação de Saldo**: Consulta o saldo do usuário em tempo real e compara com o preço do produto.
- **Bloqueios**:
    - Botão de compra desabilitado se o saldo for insuficiente.
    - Botão de compra desabilitado se a máquina estiver offline.
    - Link direto para recarga (`/account/wallet/topup`) caso o saldo seja baixo.
- **Autorização**: Envia o comando de checkout para o backend com `Idempotency-Key` para evitar cobranças duplicadas.

## 2. Acompanhamento de Compra (`/purchase/[id]`)

Após a autorização, o usuário é redirecionado para a tela de acompanhamento, onde o status é atualizado via polling (3 segundos).

### Estados da Compra:
- **AUTHORIZED**: Venda aprovada e aguardando comando da máquina.
- **DISPENSING**: Máquina processando a entrega física do produto.
- **DISPENSED**: Sucesso! Produto liberado e detectado pelo sensor.
- **FAILED**: Houve um erro na máquina (ex: motor travado).
- **REFUNDED**: O produto não caiu e o saldo foi estornado automaticamente pelo backend.

### Elementos da Interface:
- **Timeline Visual**: Mostra o progresso real da operação.
- **Badge de Status**: Cores semânticas para cada estado (Verde para sucesso, Vermelho para falha).
- **Instrução de Retirada**: Mensagem clara para o usuário retirar o produto quando `DISPENSED`.
- **Relato de Problema**: Botão direto para suporte via WhatsApp com mensagem pré-preenchida incluindo o ID da venda.

## 3. Comportamento Técnico

- **Polling Inteligente**: As consultas param automaticamente assim que a venda atinge um estado final (`DISPENSED`, `FAILED` ou `REFUNDED`).
- **Segurança**: A página é protegida por `RouteGuard` e valida se a venda pertence ao usuário logado.
- **Robustez**: Tratamento de erros de API durante o polling para evitar quebras na interface.
