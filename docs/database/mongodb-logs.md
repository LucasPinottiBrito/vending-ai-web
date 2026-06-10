# MongoDB Logs

MongoDB e o banco NoSQL do projeto e deve ser usado exclusivamente para logs. Dados principais da plataforma, como usuarios, produtos, maquinas, estoque, vendas, pagamentos e comandos de dispensa, pertencem ao MySQL.

## Banco e Colecao

```txt
MONGO_URI=mongodb://mongodb:27017/vending_logs
database=vending_logs
collection=logs
```

## Estrutura do Documento

Todos os logs seguem a mesma estrutura base:

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

## Eventos Obrigatorios

| Evento | Uso |
| --- | --- |
| `LOGIN_SUCCESS` | Login local concluido com sucesso |
| `LOGIN_FAILURE` | Tentativa de login rejeitada |
| `LOGOUT` | Logout solicitado pelo usuario |
| `REQUEST_ACCESS` | Acesso a rota HTTP |
| `CREATE` | Inclusao de registro em tabela MySQL |
| `UPDATE` | Alteracao de registro em tabela MySQL |
| `DELETE` | Exclusao ou desativacao de registro |
| `ERROR` | Erro controlado da aplicacao |
| `EXCEPTION` | Excecao inesperada capturada |
| `IMPORT_JSON` | Importacao JSON administrativa |
| `EXPORT_JSON` | Exportacao JSON administrativa |
| `EXPORT_XML` | Exportacao XML dos logs |
| `GENERATE_PDF_REPORT` | Geracao de relatorio PDF |
| `GENERATE_CHART_DATA` | Geracao de dados para graficos administrativos |

## Campos Obrigatorios por Evento

### Login e Logout

Eventos: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`.

Obrigatorios:

- `timestamp`
- `event_type`
- `action`
- `method`
- `endpoint`
- `status_code`
- `response_time_ms`
- `ip`
- `user_agent`
- `details`

Obrigatorios quando conhecidos:

- `user_id`
- `username`

Para `LOGIN_FAILURE`, `details` pode registrar `reason`, `email_attempted` ou `auth_provider`, mas nunca deve registrar senha, token JWT completo ou segredo.

### Inclusao

Evento: `CREATE`.

Obrigatorios:

- campos HTTP base;
- `table`;
- `record_id`;
- `after`;
- `details`.

`before` deve ser `null`, pois o registro nao existia antes.

### Alteracao

Evento: `UPDATE`.

Obrigatorios:

- campos HTTP base;
- `table`;
- `record_id`;
- `before`;
- `after`;
- `details`.

`details.changed_fields` deve ser preenchido quando o service ou DAO souber quais campos foram alterados.

### Exclusao

Evento: `DELETE`.

Obrigatorios:

- campos HTTP base;
- `table`;
- `record_id`;
- `before`;
- `details`.

`after` deve ser `null`. Para soft delete, `before` deve conter o estado anterior e `after` pode conter o estado com `is_active=false` se for mais util para auditoria.

### Erros e Excecoes

Eventos: `ERROR`, `EXCEPTION`.

Obrigatorios:

- campos HTTP base;
- `error`;
- `error.name`;
- `error.message`;
- `details`.

Obrigatorio quando existir:

- `stack_trace`

Use `ERROR` para erro controlado, como payload invalido, regra de negocio bloqueada, saldo insuficiente ou acesso negado. Use `EXCEPTION` para excecao inesperada capturada pelo `error_middleware`.

### Acesso a Rotas

Evento: `REQUEST_ACCESS`.

Obrigatorios:

- `timestamp`
- `event_type`
- `action`
- `method`
- `endpoint`
- `status_code`
- `response_time_ms`
- `ip`
- `user_agent`
- `details`

Obrigatorios quando a rota for autenticada:

- `user_id`
- `username`

### Exportacao XML

Evento: `EXPORT_XML`.

Obrigatorios:

- campos HTTP base;
- `table = "logs"`;
- `details.filters`;
- `details.count`.

A exportacao XML deve consultar a colecao `logs`, aplicar filtros opcionais por usuario, periodo e tipo de evento, gerar um arquivo XML legivel e registrar a propria exportacao como auditoria.

## Indices

Indices recomendados para consulta administrativa e exportacao XML:

```js
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ event_type: 1, timestamp: -1 })
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ endpoint: 1, timestamp: -1 })
```

## Fluxo Futuro no Backend

### log_middleware

O `log_middleware` deve:

1. registrar `start_time` no inicio da requisicao;
2. aguardar o evento `finish` da resposta;
3. calcular `response_time_ms`;
4. montar um documento `REQUEST_ACCESS`;
5. preencher usuario a partir de `req.user`, quando existir;
6. enviar o documento ao `LogService`.

O middleware nao deve gravar senha, JWT completo, headers sensiveis ou body com credenciais.

### error_middleware

O `error_middleware` deve:

1. padronizar a resposta JSON de erro;
2. diferenciar erro controlado (`ERROR`) de excecao inesperada (`EXCEPTION`);
3. incluir `error.name`, `error.message` e `stack_trace`;
4. enviar o documento ao `LogService`;
5. preservar a resposta HTTP adequada para o cliente.

### LogService

O `LogService` deve:

1. validar `event_type`;
2. normalizar campos ausentes para `null` ou `{}`;
3. remover dados sensiveis;
4. chamar `LogDAO.create(logDocument)`;
5. expor filtros por `event_type`, `user_id`, `start_date`, `end_date`, `endpoint` e `status_code`;
6. fornecer dados para exportacao XML.

### LogDAO

O `LogDAO` deve ser o unico responsavel por acessar MongoDB. Controllers e services de negocio nao devem usar o driver MongoDB diretamente.

## Consultas de Validacao

Por tipo:

```js
db.logs.find({ event_type: "REQUEST_ACCESS" }).sort({ timestamp: -1 })
```

Por usuario:

```js
db.logs.find({ user_id: 1 }).sort({ timestamp: -1 })
```

Por data:

```js
db.logs.find({
  timestamp: {
    $gte: new Date("2026-06-09T00:00:00.000Z"),
    $lt: new Date("2026-06-10T00:00:00.000Z")
  }
}).sort({ timestamp: 1 })
```
