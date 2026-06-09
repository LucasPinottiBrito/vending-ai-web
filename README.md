# Vending Machine Web Platform

Plataforma web full stack para gerenciamento de uma vending machine IoT. O projeto atende aos requisitos academicos da disciplina de Desenvolvimento de Aplicacao Web Full Stack e preserva um caminho limpo para integracao com ESP32-S3 via MQTT.

Este repositorio esta na fase inicial de estrutura. Ainda nao ha implementacao funcional de backend, frontend, banco de dados ou firmware.

## Objetivo

Construir uma aplicacao web para:

- permitir que usuarios acessem uma maquina por QR Code, consultem produtos, recarreguem carteira em modo mock e comprem um item;
- permitir que administradores gerenciem maquinas, slots, produtos, inventario, usuarios, vendas, pagamentos, logs, relatorios e graficos;
- manter o backend como fonte da verdade para autenticacao, saldo, estoque, autorizacao de venda e comandos de dispensa;
- registrar logs em MongoDB e dados de negocio em MySQL;
- preparar a integracao complementar com ESP32-S3 e MQTT sem misturar firmware com a aplicacao web.

## Stack obrigatoria

- Backend: Node.js + Express.
- Frontend: Next.js/React com HTML5, CSS3 e JavaScript.
- Banco relacional principal: MySQL.
- Banco NoSQL: MongoDB somente para logs.
- Autenticacao: JWT proprio no backend.
- Arquitetura backend: MVC + Service Layer + Router + Middleware.
- Docker: quatro servicos principais, `backend`, `frontend`, `mysql` e `mongodb`.

## Servicos Docker previstos

- `backend`: API Node.js + Express, porta `4000`.
- `frontend`: aplicacao Next.js/React, porta `3000`.
- `mysql`: banco relacional principal, porta `3306`.
- `mongodb`: armazenamento de logs, porta `27017`.

O broker MQTT sera externo, usando HiveMQ publico, e nao sera adicionado ao Docker Compose salvo pedido explicito.

## Estrutura de pastas

```txt
/
  backend/              # modulo da API Express
  frontend/             # modulo da aplicacao Next.js/React
  database/
    mysql/              # scripts MySQL futuros
    mongodb/            # material de apoio futuro para logs
    der/                # DER do MySQL
  docs/
    api/                # documentacao de endpoints
    database/           # documentacao de bancos e modelos
    usage/              # guias de uso e desenvolvimento
    diagrams/           # diagramas auxiliares
  firmware/             # firmware ESP32-S3, complementar ao web
  uploads/              # arquivos persistentes usados em desenvolvimento
  docker-compose.yml
  README.md
  AGENTS.md
  GEMINI.md
```

## Desenvolvimento por modulos

O projeto sera desenvolvido em etapas para manter os requisitos demonstraveis:

1. Infraestrutura Docker.
2. Banco MySQL com schema e seed.
3. MongoDB para logs.
4. Backend Express com MVC, services, DAOs, rotas e middlewares.
5. Frontend Next.js/React.
6. Integracao MQTT com ESP32-S3.
7. Testes finais, documentacao e preparacao da entrega.

O firmware fica em `firmware/` e e complementar. Ele deve seguir o contrato MQTT definido pelo backend, mas nao deve comprometer os requisitos obrigatorios da plataforma web.
