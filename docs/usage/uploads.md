# Uploads

Este guia descreve o upload local de imagens de produtos.

## Pasta de Upload

Imagens de produtos sao salvas em:

```txt
backend/src/uploads/products
```

No Docker Compose, a pasta e montada no container backend:

```txt
./backend/src/uploads/products:/app/src/uploads/products
```

Isso preserva as imagens fora do ciclo de vida do container.

## Variaveis

Backend:

```env
UPLOAD_DIR=src/uploads/products
PUBLIC_UPLOAD_BASE_URL=http://localhost:4000/uploads/products
```

`UPLOAD_DIR` define a pasta fisica. `PUBLIC_UPLOAD_BASE_URL` define a URL usada no campo `image_url` retornado pela API.

## Endpoint

```txt
POST /api/products/:id/image
```

Requisitos:

- usuario autenticado;
- role `ADMIN`;
- `multipart/form-data`;
- campo `image`.

Exemplo com curl:

```bash
curl -X POST http://localhost:4000/api/products/1/image \
  -H "Authorization: Bearer <admin-token>" \
  -F "image=@./produto.png"
```

## Tipos Aceitos

- JPEG: `image/jpeg`
- PNG: `image/png`
- WebP: `image/webp`

Limite atual:

```txt
2 MB
```

## Persistencia no MySQL

O caminho publico e salvo em `products.image_path`:

```txt
/uploads/products/1710000000000-produto.png
```

A API tambem retorna `image_url`, montada a partir de `PUBLIC_UPLOAD_BASE_URL`.

## Servir Arquivos

O Express serve arquivos estaticos em:

```txt
GET /uploads/products/<arquivo>
```

Exemplo:

```txt
http://localhost:4000/uploads/products/1710000000000-produto.png
```

## Logs

Upload de imagem atualiza `products.image_path` e registra `UPDATE` no MongoDB com `before`, `after` e `changed_fields`.
