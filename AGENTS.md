# Orientações da plataforma web

## Escopo vigente

O usuário autorizou rever a arquitetura e os requisitos acadêmicos em 2 de novembro de 2026. A especificação vigente é docs/especificacao-plataforma-v2.md; a v1.0 é histórica. Siga docs/plano-reformulacao.md e entregue uma etapa executável por vez.

## Estado atual e destino

- Atual: Next.js/React, API Express, MySQL, MongoDB para logs, JWT, carteira e pagamentos mockados; MQTT externo.
- Destino da etapa 2: três serviços locais (frontend, backend e MySQL), auditoria no MySQL e módulos por funcionalidade. Não remover MongoDB antes de migrar/verificar os logs e manter uma reversão.
- Controllers finos, validação de entrada, serviços para regras de negócio e repositórios para persistência. Classes abstratas IDAO/IService/IController deixam de ser obrigação; não é necessário removê-las nesta etapa.
- Não adicionar microsserviços, outro banco, fila ou broker local sem necessidade demonstrada.
- Frontend: app para rotas/layouts, features para funcionalidades, components/ui para primitivas e lib para integração compartilhada; reorganização física pertence à etapa 2.

## Produto e invariantes

- Preservar catálogo por QR Code e URLs existentes, autenticação, compra de um item, estoque, acompanhamento da retirada, suporte e administração.
- Preservar imagens, JSON, XML, PDF, gráficos, histórico e saldos durante a transição.
- Preço, saldo, disponibilidade, autorização e estados financeiros são decididos pelo backend. Dinheiro é representado em centavos inteiros.
- Compra/reserva/estorno exigem transações e idempotência. Nunca duplicar uma entrega por repetição de evento ou comando.
- Máquina sem heartbeat não pode vender; não simular disponibilidade na interface. Testes podem usar cliente MQTT simulado e fixtures próprias.
- Usuário comum só acessa seus dados; rotas administrativas exigem ADMIN na API. No redesign, links administrativos aparecem apenas para ADMIN autenticado, em desktop e celular.
- A sessão no navegador deve ter snapshot inicial compatível com SSR e sincronizar login/logout entre componentes e abas.
- Pagamento direto via Mercado Pago sandbox é a direção proposta para a etapa 6. A aplicação atual permanece mockada até essa entrega; não remover carteira, confirmar cobrança por retorno de URL ou expor credenciais no frontend.
- Manter os tópicos vending/{machine_id}/actions, events e status e os identificadores esperados pelo firmware. Firmware fica fora desta entrega.

## Trabalho e verificação

- Backups locais e dependências auxiliares ficam em backups/ e .local/ na raiz, ignorados pelo Git. Não publicar dumps, sessões ou .env.
- Antes de migrar dados, criar backup e comprovar restauração em destino isolado. Nunca executar down -v ou apagar volumes da aplicação como parte de validação.
- Não renomear rotas/arquivos em massa nem eliminar recursos como limpeza incidental.
- Não suprimir regras de lint para obter aprovação. Verificar lint, TypeScript, build e os testes relevantes; alterações de sessão exigem teste de recarga autenticada e sincronização entre abas.
- Frontend: ler o guia relevante da versão instalada em node_modules/next/dist/docs antes de editar código, conforme frontend/AGENTS.md.
- Docker: docker compose up --build -d. Testes: consultar docs/usage/testing.md. O teste de backend exige NODE_ENV=test para simular MQTT.
- Relatar evidências e limitações. Cada mudança de comportamento deve atualizar a documentação correspondente.
