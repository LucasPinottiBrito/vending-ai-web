# Backend Architecture

Este documento descreve a base do backend Express da Vending Machine Web Platform.

## Visao Geral

O backend usa Node.js + Express com JavaScript e classes. A estrutura foi criada para demonstrar explicitamente:

- MVC;
- Service Layer;
- Router;
- Middleware;
- contratos `IDAO`, `IService` e `IController`;
- MySQL como banco principal;
- MongoDB apenas para logs.

## Fluxo de Requisicao

```txt
Cliente HTTP
  -> Express app
  -> log_middleware
  -> routes
  -> validation_middleware e auth_middleware quando aplicavel
  -> controller
  -> service
  -> DAO
  -> MySQL ou MongoDB
  -> response.js
  -> error_middleware em caso de falha
```

## Camadas

### Routes

Arquivos em `backend/src/routes` agrupam endpoints por recurso. Cada arquivo de rota deve ser uma classe ou modulo class-like que registra verbos HTTP e middlewares.

### Controllers

Controllers recebem `req`, `res` e `next`. Eles devem apenas ler entrada validada, chamar services e retornar respostas padronizadas. Nao devem executar SQL nem conter regra de negocio.

### Services

Services concentram regras de negocio. Exemplos futuros: checkout, reserva de estoque, recarga mock, importacao JSON, exportacao XML, relatorios e publicacao MQTT.

### DAOs

DAOs concentram persistencia. Dados de negocio usam MySQL. Logs usam MongoDB na colecao `logs`.

### Middlewares

- `auth_middleware`: valida JWT e preenche `req.user`.
- `log_middleware`: registra `REQUEST_ACCESS` no MongoDB sem bloquear a resposta HTTP.
- `error_middleware`: converte excecoes em JSON padronizado e registra `ERROR` ou `EXCEPTION`.
- `validation_middleware`: valida `body`, `params`, `query` e outros locais usando Joi.

## Contratos

`IDAO`, `IService` e `IController` ficam em `backend/src/interfaces`. Eles sao classes base abstratas porque JavaScript nao possui interfaces nativas.

Cada DAO, Service e Controller futuro deve estender o contrato correspondente. Quando uma operacao nao se aplica, o metodo ainda deve existir e retornar erro controlado `501 Not implemented`.

## Conexoes

### MySQL

`backend/src/config/mysql.js` cria um pool `mysql2/promise`. O metodo `query(sql, params)` deve ser usado por DAOs MySQL. O metodo `testConnection()` executa `SELECT 1 AS ok`.

### MongoDB

`backend/src/config/mongodb.js` usa o driver oficial `mongodb`. O banco vem de `MONGO_URI` e a colecao de logs e `logs`. A inicializacao cria indices para consulta por data, tipo, usuario e endpoint.

### MQTT

`backend/src/config/mqtt.js` prepara o cliente MQTT para HiveMQ externo. MQTT nao e obrigatorio para o healthcheck, mas fica isolado para services futuros.

## Respostas JSON

Sucesso:

```json
{
  "success": true,
  "message": "Backend is healthy",
  "data": {
    "status": "ok"
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Erro:

```json
{
  "success": false,
  "message": "Invalid payload",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## Testes

Os testes ficam em `backend/tests` e usam Jest + Supertest.

Cobertura inicial:

- `GET /health`;
- `GET /api/health`;
- conexao MySQL com `SELECT 1 AS ok`;
- conexao MongoDB com `ping`;
- JSON padronizado do `error_middleware`.
