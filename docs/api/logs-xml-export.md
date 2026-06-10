# Logs XML Export

Exportacao administrativa dos logs armazenados no MongoDB em XML.

## Rota

```http
GET /api/admin/logs/export/xml?user=&start_date=&end_date=&event_type=
```

Requer JWT de usuario `ADMIN`:

```http
Authorization: Bearer <admin_jwt>
```

Usuarios sem permissao recebem `403 FORBIDDEN`.

## Filtros

Todos os filtros sao opcionais:

- `user`: filtra por `username` do log. Se o valor for numerico, filtra por `user_id`.
- `start_date`: data/hora inicial em ISO 8601.
- `end_date`: data/hora final em ISO 8601.
- `event_type`: tipo de evento registrado no MongoDB.

Exemplos:

```http
GET /api/admin/logs/export/xml
GET /api/admin/logs/export/xml?user=admin@example.com
GET /api/admin/logs/export/xml?start_date=2026-06-10T00:00:00.000Z&end_date=2026-06-10T23:59:59.999Z
GET /api/admin/logs/export/xml?event_type=ERROR
```

Tipos de evento aceitos incluem:

```txt
LOGIN_SUCCESS
LOGIN_FAILURE
LOGOUT
REQUEST_ACCESS
CREATE
UPDATE
DELETE
ERROR
EXCEPTION
IMPORT_JSON
EXPORT_JSON
EXPORT_XML
GENERATE_PDF_REPORT
```

## Resposta

Headers:

```http
Content-Type: application/xml; charset=utf-8
Content-Disposition: attachment; filename="logs-export.xml"
```

Estrutura:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<logs_export>
  <generated_at>2026-06-10T12:00:00.000Z</generated_at>
  <filters>
    <user>admin@example.com</user>
    <start_date/>
    <end_date/>
    <event_type>CREATE</event_type>
  </filters>
  <total>1</total>
  <logs>
    <log>
      <id>...</id>
      <user>admin@example.com</user>
      <user_id>1</user_id>
      <action>POST /api/products</action>
      <description>POST /api/products</description>
      <datetime>2026-06-10T12:00:00.000Z</datetime>
      <event_type>CREATE</event_type>
      <ip>127.0.0.1</ip>
      <method>POST</method>
      <endpoint>/api/products</endpoint>
      <status_code>201</status_code>
      <response_time_ms>35</response_time_ms>
      <linked_data>
        <table>products</table>
        <record_id>10</record_id>
        <before/>
        <after>
          <id>10</id>
          <sku>AGUA-500ML</sku>
        </after>
        <details/>
        <error/>
      </linked_data>
    </log>
  </logs>
</logs_export>
```

Cada item contem:

- usuario (`user`, `user_id`);
- acao (`action`);
- descricao;
- data/hora (`datetime`);
- tipo de evento (`event_type`);
- IP de origem;
- metodo, endpoint, status e tempo de resposta;
- dados vinculados (`linked_data`) com tabela, registro, `before`, `after`, `details` e erro, quando existirem.

## Auditoria

Cada exportacao bem-sucedida registra um novo log no MongoDB:

```json
{
  "event_type": "EXPORT_XML",
  "table": "logs",
  "details": {
    "filters": {
      "user": "admin@example.com",
      "start_date": null,
      "end_date": null,
      "event_type": "CREATE"
    },
    "count": 1
  }
}
```

Falhas de validacao ou autorizacao passam pelo `error_middleware` e geram erro JSON padronizado.
