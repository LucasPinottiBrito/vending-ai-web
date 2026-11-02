# Guia de Testes

Resultado mais recente e evidências da estabilização: [validação da etapa 1](../etapa1/validacao.md). O registro anterior ao final deste documento permanece como histórico.

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

Na pasta `web-platform`, inicie a aplicação e rode os testes em contêineres temporários:

```bash
docker compose up --build -d
docker compose -f docker-compose.yml -f docker-compose.test.yml run --build --rm backend-tests
docker compose -f docker-compose.yml -f docker-compose.test.yml run --build --rm --no-deps frontend-check
```

O primeiro teste roda Jest/Supertest com `NODE_ENV=test`, MySQL e MongoDB reais e MQTT simulado. As dependências de desenvolvimento são instaladas no contêiner temporário, pois a imagem de execução do backend não inclui Jest. O segundo comando de teste compila o frontend (incluindo TypeScript) e executa ESLint.

Os testes criam e removem registros nos bancos locais do Compose; use somente um ambiente de desenvolvimento. Não é necessário apagar os volumes para iniciar ou testar a plataforma.

### Validação de 2 de novembro de 2026

- Os quatro serviços iniciaram pelo Docker Compose.
- Frontend `/` e backend `/health` e `/api/health`: HTTP 200.
- Backend: 14 suítes e 96 testes aprovados.
- Frontend: build de produção e TypeScript aprovados.
- ESLint: 18 erros e 22 avisos existentes, incluindo `react-hooks/set-state-in-effect`, `@typescript-eslint/no-explicit-any` e imports sem uso; o lint ainda não passa.
- O console do navegador registrou o erro de hidratação React #418 em algumas navegações autenticadas. As telas verificadas continuaram carregando; a causa ainda precisa ser investigada.
- Navegador: redirecionamento de conta privada para login, rejeição de senha incorreta, login de cliente e administrador, logout, bloqueio administrativo para cliente, carteira, painel e busca de produtos verificados.
- A máquina física está offline sem heartbeat; a interface bloqueia a compra nesse estado. Compra, sucesso de dispensa e estorno foram cobertos pelos testes da API com MQTT simulado, sem validar retirada física.
- A suíte Playwright não foi executada; as verificações de interface acima foram feitas no navegador.

A inicialização exigiu restaurar `frontend/.env.example`. A inspeção da carteira também identificou a apresentação de estornos como débitos; `REFUND` agora usa sinal positivo e o mesmo indicador visual dos créditos.
