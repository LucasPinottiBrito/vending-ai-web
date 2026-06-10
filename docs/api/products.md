# Products API

CRUD de produtos da Vending Machine Web Platform. Dados de produto sao persistidos no MySQL, e operacoes administrativas geram logs no MongoDB.

Base URL local:

```txt
http://localhost:4000/api
```

## Modelo

Campos principais:

```json
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
  "created_at": "2026-06-09T12:00:00.000Z",
  "updated_at": "2026-06-09T12:00:00.000Z"
}
```

Valores financeiros usam centavos. `price_cents` nao aceita valor negativo.

## GET /products

Lista produtos. Pode ser usado por usuario comum e tambem sem token nesta fase.

Query params:

- `search`: busca parcial por nome.
- `category`: filtra por categoria.
- `status`: `active`, `inactive` ou `all`.
- `limit`: limite de resultados, padrao `100`.

Exemplo:

```txt
GET /api/products?search=agua&category=Bebidas&status=active
```

Response `200`:

```json
{
  "success": true,
  "message": "Products listed",
  "data": {
    "products": [
      {
        "id": 1,
        "sku": "AGUA-500ML",
        "name": "Agua Mineral 500ml",
        "category": "Bebidas",
        "price_cents": 500,
        "image_path": "/uploads/products/agua-500ml.png",
        "is_active": true
      }
    ]
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## GET /products/:id

Busca produto por id.

Response `200`:

```json
{
  "success": true,
  "message": "Product found",
  "data": {
    "product": {
      "id": 1,
      "sku": "AGUA-500ML",
      "name": "Agua Mineral 500ml",
      "price_cents": 500,
      "is_active": true
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Produto inexistente retorna `404` com `PRODUCT_NOT_FOUND`.

## POST /products

Cria produto. Exige token JWT de usuario `ADMIN`.

Header:

```txt
Authorization: Bearer <admin-token>
```

Request:

```json
{
  "sku": "SUCO-UVA-300",
  "name": "Suco de Uva 300ml",
  "description": "Bebida integral sem gas.",
  "category": "Bebidas",
  "price_cents": 900,
  "is_active": true
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 10,
      "sku": "SUCO-UVA-300",
      "name": "Suco de Uva 300ml",
      "price_cents": 900,
      "is_active": true
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Efeitos:

- insere registro em `products`;
- registra `CREATE` em `vending_logs.logs`.

## PUT /products/:id

Atualiza produto. Exige `ADMIN`.

Request:

```json
{
  "name": "Suco de Uva Integral 300ml",
  "category": "Bebidas",
  "price_cents": 950,
  "is_active": true
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": 10,
      "name": "Suco de Uva Integral 300ml",
      "price_cents": 950
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Efeitos:

- atualiza `products`;
- registra `UPDATE` em `vending_logs.logs` com `before`, `after` e campos alterados.

## DELETE /products/:id

Desativa produto. Exige `ADMIN`.

Response `200`:

```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "data": {
    "product": {
      "id": 10,
      "is_active": false
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

Efeitos:

- faz soft delete com `is_active = 0`;
- registra `DELETE` em `vending_logs.logs`.

## POST /products/:id/image

Faz upload de imagem local. Exige `ADMIN`.

Headers:

```txt
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

Campo multipart:

```txt
image
```

Tipos aceitos:

- `image/jpeg`
- `image/png`
- `image/webp`

Response `200`:

```json
{
  "success": true,
  "message": "Product image uploaded successfully",
  "data": {
    "product": {
      "id": 10,
      "image_path": "/uploads/products/1710000000000-suco-uva.png",
      "image_url": "http://localhost:4000/uploads/products/1710000000000-suco-uva.png"
    }
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

O arquivo e salvo em:

```txt
backend/src/uploads/products
```

E servido por:

```txt
GET /uploads/products/<arquivo>
```

## Autorizacao

Usuarios comuns podem listar e visualizar produtos.

Somente `ADMIN` pode:

- criar;
- editar;
- desativar;
- fazer upload de imagem.

Tentativas sem permissao retornam `403 FORBIDDEN`.

## Validacao

Erros de payload retornam `400 VALIDATION_ERROR`.

Exemplo para preco negativo:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "price_cents",
        "message": "\"price_cents\" must be greater than or equal to 0"
      }
    ]
  },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

## Logs MongoDB

Eventos registrados:

- `CREATE`
- `UPDATE`
- `DELETE`

Campos relevantes:

```json
{
  "event_type": "UPDATE",
  "table": "products",
  "record_id": 10,
  "before": {},
  "after": {},
  "details": {
    "changed_fields": ["name", "price_cents"]
  }
}
```
