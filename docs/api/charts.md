# Charts API

Endpoint administrativo que entrega dados prontos para Chart.js usando agregacoes do MySQL.

Base:

```txt
/api/admin/charts
```

Todas as rotas exigem JWT de usuario `ADMIN`.

## GET /sales-by-month

```http
GET /api/admin/charts/sales-by-month?year=
```

Filtro opcional:

- `year`: ano numerico, entre `2000` e `2100`.

Resposta:

```json
{
  "success": true,
  "message": "Sales by month chart generated",
  "data": {
    "chart": {
      "type": "sales_by_month",
      "generated_at": "2031-07-31T12:00:00.000Z",
      "filters": {
        "year": 2031
      },
      "labels": ["2031-06", "2031-07"],
      "datasets": [
        {
          "label": "Quantidade de vendas",
          "data": [2, 2]
        },
        {
          "label": "Total vendido (centavos)",
          "data": [1700, 1300]
        },
        {
          "label": "Falhas",
          "data": [1, 0]
        },
        {
          "label": "Estornos",
          "data": [0, 1]
        }
      ]
    }
  }
}
```

O formato pode ser usado diretamente em Chart.js:

```js
new Chart(ctx, {
  type: "bar",
  data: {
    labels: response.data.chart.labels,
    datasets: response.data.chart.datasets
  }
});
```

## Logs

Cada geracao registra auditoria no MongoDB:

```json
{
  "event_type": "GENERATE_CHART_DATA",
  "table": "sales",
  "details": {
    "chart_type": "sales_by_month",
    "filters": {
      "year": 2031
    },
    "labels_count": 2
  }
}
```

Os valores financeiros sao sempre retornados em centavos.
