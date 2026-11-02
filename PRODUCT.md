# Produto — Vending AI

## Pessoas e propósito

Clientes próximos a uma vending machine acessam seu catálogo pelo celular ou QR Code, escolhem um produto e acompanham a retirada. Operadores e administradores gerenciam máquinas, produtos, estoque, pedidos, pagamentos e ocorrências.

## Experiência desejada

Compra rápida com disponibilidade verdadeira, preço claro e acompanhamento de pagamento e entrega. A interface deve ser moderna, acolhedora, legível e inteiramente sem serifa. A administração prioriza tarefas e alertas úteis. O link administrativo só aparece para ADMIN autenticado; a API mantém sua própria autorização.

## Transição

Hoje a compra usa carteira com recarga mockada. O destino proposto é pagamento por compra no Mercado Pago sandbox. Saldos, transações e pedidos existentes permanecem preservados enquanto a transição não for resolvida.

## Princípios

- Poucas etapas, ações claras e layout prioritariamente móvel.
- Máquina offline, pagamento pendente e falha de retirada são estados distintos e explícitos.
- Componentes consistentes, sem tabelas ou cartões repetidos por conveniência de implementação.
- Foco visível, teclado, rótulos, contraste e estados que não dependem somente de cor; meta WCAG AA.
- Fotos e dados reais do produto; sem métricas, depoimentos ou disponibilidade inventados.

## Limites desta fase

A etapa 1 estabiliza código e documentação. Identidade visual, layout completo e navegação por perfil serão implementados nas etapas de design; a arquitetura por módulos e os logs no MySQL pertencem à etapa 2. Consulte docs/especificacao-plataforma-v2.md.
