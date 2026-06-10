# Import/Export JSON

Endpoints administrativos para importar e exportar dados MySQL em JSON legivel.

Base URL:

```txt
/api/admin
```

Todas as rotas exigem:

```http
Authorization: Bearer <admin_jwt>
```

Usuarios sem role `ADMIN` recebem `403 FORBIDDEN`.

## Entidades Suportadas

```txt
products
inventory
```

Qualquer outro valor em `entity` retorna erro `400`.

## Formato JSON

Importacao e exportacao usam o envelope:

```json
{
  "entity": "products",
  "records": []
}
```

O valor de `entity` dentro do arquivo deve ser igual ao `entity` informado na query string.

## GET /export/json

Exporta dados do MySQL.

Exemplos:

```http
GET /api/admin/export/json?entity=products
GET /api/admin/export/json?entity=inventory
```

Resposta:

```json
{
  "success": true,
  "message": "JSON exported successfully",
  "data": {
    "export": {
      "entity": "products",
      "exported_at": "2026-06-10T12:00:00.000Z",
      "count": 1,
      "records": [
        {
          "id": 1,
          "sku": "AGUA-500ML",
          "name": "Agua Mineral 500ml",
          "description": "Garrafa de agua mineral sem gas.",
          "category": "Bebidas",
          "price_cents": 500,
          "image_path": "/uploads/products/agua-500ml.png",
          "image_url": "http://localhost:4000/uploads/products/agua-500ml.png",
          "is_active": true,
          "created_at": "2026-06-01T11:00:00.000Z",
          "updated_at": "2026-06-01T11:00:00.000Z"
        }
      ]
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

A resposta inclui `Content-Disposition` com nome de arquivo `<entity>-export.json`.

## POST /import/json

Importa dados por upload de arquivo `.json`.

Exemplos:

```http
POST /api/admin/import/json?entity=products
POST /api/admin/import/json?entity=inventory
```

O campo multipart deve se chamar `file`.

Exemplo com curl:

```bash
curl -X POST "http://localhost:4000/api/admin/import/json?entity=products" \
  -H "Authorization: Bearer <admin_jwt>" \
  -F "file=@docs/examples/products-import.example.json;type=application/json"
```

Resposta:

```json
{
  "success": true,
  "message": "JSON imported successfully",
  "data": {
    "entity": "products",
    "imported_count": 2,
    "products": []
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## Formato de Products

Arquivo de exemplo:

```txt
docs/examples/products-import.example.json
```

Campos por registro:

- `sku`: obrigatorio, unico, ate 64 caracteres.
- `name`: obrigatorio, 2 a 160 caracteres.
- `description`: opcional.
- `category`: opcional.
- `price_cents`: obrigatorio, inteiro em centavos, nao negativo.
- `image_path`: opcional.
- `is_active`: opcional, booleano.

A importacao nao sobrescreve produtos. Se o `sku` ja existir no MySQL ou estiver duplicado no arquivo, a API retorna `409 IMPORT_CONFLICT`.

## Formato de Inventory

Arquivo de exemplo:

```txt
docs/examples/inventory-import.example.json
```

Campos por registro:

- `machine_id`: obrigatorio, deve existir em `machines`.
- `slot_id`: obrigatorio, deve existir em `slots`.
- `product_id`: obrigatorio, deve existir em `products` e estar ativo.
- `quantity_available`: obrigatorio, inteiro nao negativo.
- `quantity_reserved`: obrigatorio, inteiro nao negativo.
- `min_quantity_alert`: opcional, inteiro nao negativo.

Regras:

- `slot_id` deve pertencer a `machine_id`.
- `quantity_reserved` nao pode ser maior que `quantity_available`.
- o slot nao pode possuir inventory existente.
- o exemplo usa IDs ilustrativos; ajuste para IDs existentes e um slot livre no seu banco.

A importacao nao sobrescreve inventory. Conflitos de slot retornam `409 IMPORT_CONFLICT`.

## Erros

JSON malformado:

```json
{
  "success": false,
  "message": "Invalid JSON file",
  "error": {
    "code": "INVALID_JSON_FILE",
    "details": null
  }
}
```

Estrutura invalida:

```json
{
  "success": false,
  "message": "Invalid import structure",
  "error": {
    "code": "INVALID_IMPORT_STRUCTURE",
    "details": [
      {
        "record_index": 0,
        "field": "name",
        "message": "\"name\" is required"
      }
    ]
  }
}
```

Entidade do arquivo diferente da query:

```json
{
  "success": false,
  "message": "Import file entity does not match query entity",
  "error": {
    "code": "IMPORT_ENTITY_MISMATCH",
    "details": null
  }
}
```

## Logs MongoDB

Operacoes bem-sucedidas registram logs:

- `EXPORT_JSON`
- `IMPORT_JSON`

Campos relevantes:

```json
{
  "event_type": "IMPORT_JSON",
  "table": "products",
  "details": {
    "entity": "products",
    "count": 2,
    "filename": "products-import.example.json"
  }
}
```

Falhas controladas tambem passam pelo `error_middleware` e geram log `ERROR`.
