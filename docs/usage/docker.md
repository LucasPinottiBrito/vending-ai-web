# Docker Usage

Este guia descreve como executar a infraestrutura Docker da Vending Machine Web Platform.

## Servicos

O Compose sobe quatro servicos principais:

| Servico | Imagem/build | Porta | Uso |
| --- | --- | ---: | --- |
| `backend` | `./backend/Dockerfile` | 4000 | API Node.js + Express |
| `frontend` | `./frontend/Dockerfile` | 3000 | Aplicacao Next.js |
| `mysql` | `mysql:8.0` | 3306 | Banco relacional principal |
| `mongodb` | `mongo:7` | 27017 | Logs em MongoDB |

Todos os servicos entram na rede `vending_network`.

O MySQL executa automaticamente `database/mysql/schema.sql` e `database/mysql/seed.sql` na primeira inicializacao, quando `mysql_data` ainda esta vazio.

## Variaveis de ambiente

Arquivos de exemplo:

```bash
backend/.env.example
frontend/.env.example
```

Para customizar valores locais, copie os exemplos:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

O Compose carrega `.env.example` e tambem carrega `.env` quando existir. Os valores de `.env` podem sobrescrever os exemplos.

## Subir os servicos

Validar a sintaxe primeiro:

```bash
docker compose config
```

Construir e subir em primeiro plano:

```bash
docker compose up --build
```

Construir e subir em segundo plano:

```bash
docker compose up --build -d
```

## Parar os servicos

Parar sem apagar dados:

```bash
docker compose down
```

Parar e remover volumes persistentes:

```bash
docker compose down -v
```

Use `down -v` somente quando quiser apagar dados do MySQL e MongoDB.

## Volumes

| Volume/pasta | Montagem | Finalidade |
| --- | --- | --- |
| `mysql_data` | `/var/lib/mysql` | Dados do MySQL |
| `mongo_data` | `/data/db` | Dados do MongoDB |
| `./backend/src/uploads/products` | `/app/src/uploads/products` | Upload local de imagens de produtos |
| `./database/mysql/schema.sql` | `/docker-entrypoint-initdb.d/01_schema.sql` | Schema inicial do MySQL |
| `./database/mysql/seed.sql` | `/docker-entrypoint-initdb.d/02_seed.sql` | Dados iniciais do MySQL |

## URLs e portas

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Healthcheck backend: http://localhost:4000/health
- MySQL: `localhost:3306`
- MongoDB: `localhost:27017`

## Credenciais locais do MySQL

```txt
database: vending_machine
user: vending_user
password: vending_pass
root password: root_pass
```

## Validacoes manuais

Verificar status dos containers:

```bash
docker compose ps
```

Verificar MySQL:

```bash
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot_pass
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SELECT 1;" vending_machine
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SHOW TABLES;" vending_machine
```

Verificar MongoDB:

```bash
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

Verificar backend:

```bash
curl http://localhost:4000/health
```

Verificar frontend:

```bash
curl http://localhost:3000
```
