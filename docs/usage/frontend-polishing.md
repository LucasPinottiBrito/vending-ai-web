# Polimento do frontend

Este guia documenta o polimento de produto aplicado ao frontend da Vending AI.
As mudancas reposicionam a interface como uma experiencia real de compra e
gestao de vending machines, sem alterar regras criticas de negocio.

## Rotas afetadas

- `/`: home com linguagem de produto, etapas de uso, beneficios, resumo da
  solucao e chamada para compra.
- `/catalogo`: nova entrada principal para selecionar uma vending machine antes
  de visualizar produtos.
- `/m/[slug]`: catalogo publico de uma maquina, mantido para QR Code e links
  diretos.
- `/m/[slug]/product/[productId]`: detalhe do produto com imagem resiliente e
  informacoes voltadas ao usuario.
- `/m/[slug]/checkout/[slotId]`: confirmacao de compra sem bloqueio visual por
  ausencia de heartbeat durante a demonstracao.
- `/account` e `/account/wallet`: textos de conta, saldo e historico ajustados.
- `/admin`: navegacao e modulos administrativos com linguagem de gerenciamento.

## Comportamento temporario de demonstracao

Na fase atual, o firmware ESP32-S3 e o heartbeat real ainda podem nao estar
ativos durante a demonstracao da plataforma web. Por isso, o frontend exibe as
maquinas como `Online` na selecao de maquinas e no catalogo.

Esse comportamento e temporario e esta documentado no codigo com o comentario:

```js
// Demo mode: until ESP32-S3 heartbeat is fully integrated, catalog displays machines as online.
```

Importante: essa regra muda apenas a apresentacao e o bloqueio visual do
frontend. O backend continua sendo a fonte da verdade para preco, saldo,
estoque, status real da maquina e autorizacao de compra. Se a compra nao puder
ser autorizada, a resposta do backend continua sendo exibida ao usuario.

## Como testar

1. Abra `/` e confirme que a pagina apresenta o produto, os passos de compra,
   beneficios, area administrativa e chamadas para acao.
2. Abra `/catalogo` e confirme os estados de carregamento, erro e lista de
   maquinas quando o backend estiver disponivel.
3. Em `/catalogo`, clique em `Comprar nesta maquina` e confirme a navegacao para
   `/m/[slug]`.
4. Em `/m/[slug]`, confirme status visual `Online`, busca `Buscar produto...`,
   cards com preco, slot, disponibilidade e botao de compra.
5. Teste produto sem imagem ou com imagem quebrada e confirme o placeholder
   visual.
6. Abra `/account` e `/account/wallet` para validar `Tipo de conta`, `Saldo
   disponivel`, `Recarregar saldo` e `Ver historico`.
7. Abra `/admin` e confirme que a navegacao usa linguagem de gerenciamento:
   maquinas, produtos, estoque, vendas, relatorios, indicadores e atividades.

## Validacao recomendada

```bash
cd frontend
npm run lint
npm run build
```

Tambem e recomendado buscar termos de desenvolvimento na UI publica:

```bash
rg -n "API online|endpoint|CRUD|JWT|MySQL|MongoDB|Chart\\.js|backend valida|frontend conectado" frontend/app frontend/components
```

Termos tecnicos podem continuar existindo em documentacao, codigos de eventos e
areas administrativas quando forem parte de requisitos demonstraveis, como JSON,
XML e PDF.
