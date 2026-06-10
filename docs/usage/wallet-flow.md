# Fluxo de Carteira e Recarga Mockada

Este documento descreve como os usuários gerenciam seu saldo e realizam recargas simuladas para testes.

## 1. Visualização de Saldo e Transações

O usuário pode visualizar seu saldo em tempo real no painel da conta (`/account`) ou na página detalhada da carteira (`/account/wallet`).

### Funcionalidades:
- **Saldo Atual**: Exibido em BRL (formatado de centavos).
- **Histórico de Transações**: Lista todas as entradas (CREDIT) e saídas (DEBIT, REFUND) com status e data.

## 2. Fluxo de Recarga (Mock)

Como o sistema é acadêmico, a recarga utiliza um fluxo simulado.

### Passos:
1. **Página de Recarga**: O usuário acessa `/account/wallet/topup`.
2. **Formulário**: Informa o valor em centavos (mínimo de 100 centavos = R$ 1,00).
3. **Geração do Pagamento**: O frontend chama `POST /api/wallet/topup/mock`. Isso cria um registro de pagamento com status `PENDING`.
4. **Card de Pagamento Mock**: O sistema exibe um código simulado e o valor gerado.
5. **Confirmação**: O usuário clica em "Confirmar Pagamento Mock". O frontend chama `POST /api/payments/:id/confirm-mock`.
6. **Crédito**: O backend valida o pagamento, altera seu status para `PAID`, credita a carteira do usuário e registra a transação.

## 3. Validações e Segurança

- **Valor Mínimo**: Validado no frontend via Zod e no backend via Joi.
- **Autenticação**: Todas as rotas exigem JWT válido.
- **Idempotência de Confirmação**: O backend garante que um pagamento mock só possa ser confirmado e creditado uma única vez.
- **Logs**: Todas as operações de criação de pagamento, atualização de saldo e confirmação são registradas no MongoDB para auditoria.

## 4. Estados de Erro

- **Saldo Insuficiente**: Erro exibido durante o checkout de produtos.
- **Erro de API**: Exibido via Toast ou Alert caso o backend retorne erro de validação ou processamento.
