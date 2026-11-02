# Vending AI — plataforma web

Plataforma de compra e operação de vending machines, com Next.js/React, API Express e integração ESP32-S3 por MQTT.

O escopo foi revisado para simplificar a aplicação e reformular o frontend. Leia a [especificação v2](docs/especificacao-plataforma-v2.md) e o [plano em etapas](docs/plano-reformulacao.md). O redesign e o pagamento externo ainda são entregas futuras.

## Estado atual

- Quatro serviços: frontend, backend, MySQL e MongoDB para logs.
- JWT, catálogo por máquina/QR Code, carteira, recarga mockada, checkout, histórico, estoque e eventos MQTT.
- Administração de produtos, máquinas, slots, estoque e usuários; consultas de vendas/pagamentos; importação/exportação JSON, XML de logs, PDF e gráfico mensal.
- A ausência de heartbeat bloqueia a compra. A disponibilidade não é simulada na interface.
- O destino da etapa 2 é ter três serviços, com logs no MySQL; MongoDB permanece necessário até a migração ser concluída.

## Executar

Na pasta web-platform, com Docker Desktop ativo:

~~~bash
docker compose up --build -d
docker compose ps
~~~

O Compose usa backend/.env.example e frontend/.env.example; arquivos .env locais são opcionais e não devem ser publicados. Schema e seed são carregados automaticamente quando o volume MySQL está vazio. Não remova volumes para iniciar a aplicação.

- [Frontend](http://localhost:3000)
- [Saúde da API](http://localhost:4000/api/health)
- MySQL: localhost:3306; MongoDB: localhost:27017.

Contas somente de demonstração local: admin@example.com / Admin@123 e cliente@example.com / Cliente@123. Pagamentos atuais são simulados.

## Testes

~~~bash
docker compose -f docker-compose.yml -f docker-compose.test.yml run --build --rm backend-tests
docker compose -f docker-compose.yml -f docker-compose.test.yml run --build --rm --no-deps frontend-check
~~~

Com dependências instaladas em frontend:

~~~bash
npm run lint -- --max-warnings=0
npm run build
npm run test:e2e -- --project=chromium
~~~

Playwright usa Chrome instalado e os serviços já ativos. Testes usam bancos locais e fixtures próprias; não apontar para produção. O runner do backend força NODE_ENV=test para evitar publicar comandos MQTT reais.

## Documentação

- [Produto](PRODUCT.md) e [orientações de desenvolvimento](AGENTS.md).
- [Especificação vigente](docs/especificacao-plataforma-v2.md) e [plano](docs/plano-reformulacao.md).
- [Validação da etapa 1](docs/etapa1/validacao.md), [inventário](docs/etapa1/inventario.json) e [recuperação](docs/usage/backup-restauracao.md).
- [API](docs/api/index.md), [frontend](frontend/README.md), [testes](docs/usage/testing.md) e [Docker](docs/usage/docker.md).
- [Especificação v1.0 histórica](docs/especificacao_plataforma_web_vending_machine_v1_0.md).

O firmware e o material de hardware ficam fora de web-platform. A etapa 1 não altera seus contratos.
