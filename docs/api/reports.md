# Reports API

Endpoints administrativos que entregam dados vindos do MySQL para geracao de relatorios PDF no frontend.

Base:

```txt
/api/admin/reports
```

Todas as rotas exigem JWT de usuario `ADMIN`.

```http
Authorization: Bearer <admin_jwt>
```

## GET /sales

Relatorio de vendas por periodo.

```http
GET /api/admin/reports/sales?start_date=&end_date=&machine_id=&status=
```

Filtros opcionais:

- `start_date`: data/hora inicial em ISO 8601.
- `end_date`: data/hora final em ISO 8601.
- `machine_id`: id da maquina.
- `status`: `CREATED`, `AUTHORIZED`, `DISPENSING`, `DISPENSED`, `FAILED` ou `REFUNDED`.

Resposta:

```json
{
  "success": true,
  "message": "Sales report generated",
  "data": {
    "report": {
      "type": "sales",
      "period": {
        "start_date": "2031-06-01T00:00:00.000Z",
        "end_date": "2031-06-30T23:59:59.999Z"
      },
      "filters": {
        "machine_id": 1,
        "status": "DISPENSED"
      },
      "generated_by": {
        "id": 1,
        "name": "Admin Vending",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "summary": {
        "total_sold_cents": 1000,
        "sales_count": 1,
        "failure_count": 0,
        "refund_count": 0
      },
      "sales": []
    }
  }
}
```

Cada venda inclui usuario, maquina, status, valor, datas e itens vendidos.

## GET /purchase-history

Relatorio de historico de compras.

```http
GET /api/admin/reports/purchase-history?user_id=&start_date=&end_date=
```

Filtros opcionais:

- `user_id`: id do usuario.
- `start_date`: data/hora inicial em ISO 8601.
- `end_date`: data/hora final em ISO 8601.

Resposta:

```json
{
  "success": true,
  "message": "Purchase history report generated",
  "data": {
    "report": {
      "type": "purchase_history",
      "user_id": 2,
      "period": {
        "start_date": "2031-07-01T00:00:00.000Z",
        "end_date": "2031-07-31T23:59:59.999Z"
      },
      "summary": {
        "total_spent_cents": 1300,
        "purchase_count": 2,
        "failure_count": 0,
        "refund_count": 1
      },
      "purchases": []
    }
  }
}
```

## Logs

Cada relatorio gerado registra log MongoDB:

```json
{
  "event_type": "GENERATE_PDF_REPORT",
  "table": "sales",
  "details": {
    "report_type": "sales",
    "filters": {},
    "summary": {}
  }
}
```

Os dados de negocio continuam exclusivamente no MySQL; o MongoDB guarda apenas auditoria.
