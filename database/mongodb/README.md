# MongoDB Logs

MongoDB e usado exclusivamente para logs do sistema. Entidades de negocio, como usuarios, produtos, vendas, estoque, pagamentos e comandos de dispensa, pertencem ao MySQL.

## Banco e Colecao

```txt
database: vending_logs
collection: logs
```

## Eventos Obrigatorios

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE`
- `LOGOUT`
- `REQUEST_ACCESS`
- `CREATE`
- `UPDATE`
- `DELETE`
- `ERROR`
- `EXCEPTION`

Eventos futuros, como importacao JSON, exportacao XML e relatorios PDF, tambem devem usar a colecao `logs`.

## Estrutura Base

```json
{
  "timestamp": "2026-01-01T12:00:00.000Z",
  "event_type": "REQUEST_ACCESS",
  "action": "GET /api/products",
  "user_id": 1,
  "username": "admin",
  "method": "GET",
  "endpoint": "/api/products",
  "status_code": 200,
  "response_time_ms": 35,
  "ip": "127.0.0.1",
  "user_agent": "Mozilla/5.0",
  "table": null,
  "record_id": null,
  "before": null,
  "after": null,
  "details": {},
  "error": null,
  "stack_trace": null
}
```

## Campos por Tipo de Evento

### Login e Logout

Tipos: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`.

Campos obrigatorios:

- `timestamp`
- `event_type`
- `action`
- `user_id`, quando o usuario for conhecido
- `username`, quando o usuario for conhecido
- `method`
- `endpoint`
- `status_code`
- `response_time_ms`
- `ip`
- `user_agent`
- `details`

Para `LOGIN_FAILURE`, `user_id` pode ser `null`. Nao registrar senha, token JWT completo ou segredos.

### Inclusao

Tipo: `CREATE`.

Campos obrigatorios:

- campos base de request;
- `table`;
- `record_id`;
- `after`;
- `details`.

`before` deve ser `null`.

### Alteracao

Tipo: `UPDATE`.

Campos obrigatorios:

- campos base de request;
- `table`;
- `record_id`;
- `before`;
- `after`;
- `details.changed_fields`, quando possivel.

### Exclusao

Tipo: `DELETE`.

Campos obrigatorios:

- campos base de request;
- `table`;
- `record_id`;
- `before`;
- `details`.

`after` deve ser `null`.

### Erros e Excecoes

Tipos: `ERROR`, `EXCEPTION`.

Campos obrigatorios:

- campos base de request;
- `error.name`;
- `error.message`;
- `stack_trace`, quando existir;
- `details`.

Use `ERROR` para erros controlados da aplicacao e `EXCEPTION` para falhas inesperadas capturadas pelo middleware global.

### Acesso a Rotas

Tipo: `REQUEST_ACCESS`.

Campos obrigatorios:

- `timestamp`
- `event_type`
- `action`
- `user_id`, quando autenticado
- `username`, quando autenticado
- `method`
- `endpoint`
- `status_code`
- `response_time_ms`
- `ip`
- `user_agent`
- `details`

## Exemplos

- `examples/request-log.example.json`
- `examples/auth-log.example.json`
- `examples/crud-log.example.json`
- `examples/error-log.example.json`

## Indices Recomendados

O backend deve garantir estes indices ao inicializar o `LogDAO` ou a conexao MongoDB:

```js
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ event_type: 1, timestamp: -1 })
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ endpoint: 1, timestamp: -1 })
```

## Validacao Manual

Subir MongoDB:

```bash
docker compose up --build -d mongodb
```

Inserir eventos de validacao:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.logs.insertMany([{timestamp:new Date('2026-06-09T12:00:00.000Z'),event_type:'REQUEST_ACCESS',action:'GET /api/products',user_id:1,username:'admin',method:'GET',endpoint:'/api/products',status_code:200,response_time_ms:35,ip:'127.0.0.1',user_agent:'Mozilla/5.0',table:null,record_id:null,before:null,after:null,details:{validation_run:'mongodb-logs'},error:null,stack_trace:null}])"
```

Consultar por tipo:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.logs.find({event_type:'REQUEST_ACCESS'}).limit(5).toArray()"
```

Consultar por usuario:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.logs.find({user_id:1}).limit(5).toArray()"
```

Consultar por data:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.logs.find({timestamp:{$gte:new Date('2026-06-09T00:00:00.000Z'),$lt:new Date('2026-06-10T00:00:00.000Z')}}).toArray()"
```
