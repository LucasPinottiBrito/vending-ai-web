# Guia de Testes

O projeto utiliza **Jest** como framework de testes e **Supertest** para testes de integração de API. A estratégia de testes foca em garantir que os requisitos acadêmicos e as regras de negócio críticas (como checkout e saldo) funcionem corretamente.

## Estrutura de Testes

Os testes estão localizados na pasta `backend/tests/` e cobrem as seguintes áreas:

- **Autenticação:** Registro, login, proteção de rotas e expiração de token.
- **Conexões:** Verificação de conectividade com MySQL e MongoDB.
- **CRUDs:** Validação completa de Máquinas, Produtos, Slots e Inventário.
- **Middlewares:** Comportamento dos middlewares de log, erro e validação.
- **Business Logic:**
  - Fluxo de Checkout (reserva de estoque, débito de saldo).
  - Pagamentos e Recargas (idempotência e confirmação).
  - Importação/Exportação JSON.
  - Exportação XML de logs.
  - Geração de dados para Relatórios e Gráficos.
- **IoT/MQTT:** Processamento de eventos simulados e publicação de comandos.

## Pré-requisitos para Rodar os Testes

Para executar os testes locais, você precisa:
1. Instalar as dependências: `npm install` na pasta `backend`.
2. Ter o MySQL e MongoDB rodando (via Docker ou local).
3. Configurar o `.env` com as credenciais corretas (ou usar os valores padrão se estiver usando o Docker Compose do projeto).

## Como Executar

### Todos os Testes
Para rodar todos os testes em sequência:
```bash
npm test
```

### Teste Específico
Para rodar apenas um arquivo de teste:
```bash
npx jest tests/auth.test.js
```

### Com Cobertura
Para gerar o relatório de cobertura:
```bash
npx jest --coverage
```

## Configuração de Ambiente de Teste

O arquivo `backend/src/config/env.js` detecta automaticamente quando o ambiente é de teste (`NODE_ENV=test`). 
- Em modo de teste, o sistema tenta se conectar aos bancos de dados em `127.0.0.1` se as variáveis `MYSQL_HOST` ou `MONGO_URI` não estiverem definidas.
- Os logs de requisição durante os testes são gravados normalmente no MongoDB para validar o funcionamento do `log_middleware`.

## Validação Manual via Swagger/Postman

Embora não exista um Swagger UI automático (seguindo a restrição de simplicidade acadêmica), as rotas podem ser testadas via Postman ou Insomnia utilizando a lista de endpoints disponível no `README.md`.

## Testes de Integração Docker

Para validar o ambiente completo:
1. `docker compose up -d`
2. `docker compose exec backend npm test`

Isso garante que o código funciona dentro do container e consegue se comunicar com os outros serviços (MySQL e MongoDB) através dos hostnames da rede do Docker.
