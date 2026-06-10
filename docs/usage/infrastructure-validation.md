# Validacao da infraestrutura

Este guia valida somente a base de infraestrutura do projeto: Docker Compose, MySQL, MongoDB, backend temporario e frontend temporario. Nesta etapa nao e esperado backend funcional completo, autenticacao, CRUDs ou gravacao automatica de logs.

## Pre-requisitos

- Docker Desktop em execucao.
- Portas locais livres: `3000`, `4000`, `3306` e `27017`.
- Arquivos `.env` opcionais em `backend/.env` e `frontend/.env`. Se eles nao existirem, o Compose usa os valores dos arquivos `.env.example`.

## Subida limpa do ambiente

Use estes comandos quando quiser validar tudo do zero:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
```

Resultado esperado:

- containers `backend`, `frontend`, `mysql` e `mongodb` criados;
- rede Compose `vending_network` criada, com nome Docker prefixado pelo projeto, por exemplo `vending-ai-web_vending_network`;
- volumes `mysql_data` e `mongo_data` criados;
- servicos `mysql`, `mongodb`, `backend` e `frontend` com estado `Up`;
- servicos com healthcheck devem aparecer como `healthy`.

## Validar MySQL

Verifique se o servidor responde:

```bash
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot_pass
```

Resultado esperado:

```txt
mysqld is alive
```

Verifique se o schema e os seeds foram carregados:

```bash
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SHOW TABLES; SELECT COUNT(*) AS products_count FROM products;" vending_machine
```

Resultado esperado:

- tabelas principais criadas, incluindo `users`, `wallets`, `machines`, `slots`, `products`, `inventory`, `sales`, `sale_items`, `payments`, `wallet_transactions`, `dispense_commands` e `machine_events`;
- `products_count` igual a `4` com o seed atual.

Observacao: o aviso do MySQL sobre senha na linha de comando e esperado em validacoes locais.

## Validar MongoDB

Verifique se o servidor responde:

```bash
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

Resultado esperado:

```json
{ "ok": 1 }
```

Verifique o banco logico de logs:

```bash
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.getCollectionNames()"
```

Resultado esperado nesta etapa:

```json
[]
```

A lista vazia e aceitavel depois de um reset completo, porque o backend funcional e o `log_middleware` ainda nao foram implementados. A colecao `logs` sera criada automaticamente quando o backend inserir o primeiro documento.

## Validar backend temporario

Linux/macOS/Git Bash:

```bash
curl http://localhost:4000/health
```

PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
```

Resultado esperado:

```json
{
  "status": "ok",
  "service": "backend",
  "timestamp": "..."
}
```

## Validar frontend temporario

Linux/macOS/Git Bash:

```bash
curl -I http://localhost:3000
```

PowerShell:

```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Resultado esperado:

```txt
200
```

Tambem e possivel conferir o conteudo da pagina:

```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-String -Pattern "Vending AI"
```

## Diagnostico de conexao MySQL

Verifique o estado do container:

```bash
docker compose ps mysql
```

Leia os logs recentes:

```bash
docker compose logs mysql --tail=100
```

Teste credenciais e database:

```bash
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SELECT DATABASE();" vending_machine
```

Pontos comuns de falha:

- porta `3306` ocupada por outro MySQL local;
- volume antigo com dados de uma configuracao anterior;
- scripts `schema.sql` e `seed.sql` nao executados porque `mysql_data` ja existia;
- credenciais diferentes entre `.env`, `docker-compose.yml` e comando de teste;
- tentativa de acessar MySQL pelo hostname `localhost` de dentro de outro container. Entre containers, use o hostname `mysql`.

No Windows, para investigar conflito de porta:

```powershell
netstat -ano | findstr :3306
```

Para forcar recriacao limpa do MySQL:

```bash
docker compose down -v
docker compose up --build -d mysql
```

## Diagnostico de conexao MongoDB

Verifique o estado do container:

```bash
docker compose ps mongodb
```

Leia os logs recentes:

```bash
docker compose logs mongodb --tail=100
```

Teste o ping:

```bash
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

Pontos comuns de falha:

- porta `27017` ocupada por outro MongoDB local;
- volume antigo com dados de uma configuracao anterior;
- `MONGO_URI` incorreta no backend;
- tentativa de acessar MongoDB pelo hostname `localhost` de dentro de outro container. Entre containers, use o hostname `mongodb`;
- esperar a colecao `logs` logo apos reset limpo. Ela so aparece depois da primeira insercao.

No Windows, para investigar conflito de porta:

```powershell
netstat -ano | findstr :27017
```

## Verificar logs dos containers

Logs individuais:

```bash
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
docker compose logs mysql --tail=100
docker compose logs mongodb --tail=100
```

Logs em tempo real:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose logs -f mongodb
```

Todos os servicos:

```bash
docker compose logs --tail=100
```

## Resetar ambiente local

Reset completo com perda dos dados locais dos bancos:

```bash
docker compose down -v
docker compose up --build -d
```

Reset sem apagar dados persistidos:

```bash
docker compose down
docker compose up --build -d
```

Rebuild sem cache, util quando Dockerfile ou dependencias mudarem:

```bash
docker compose build --no-cache
docker compose up -d
```

## Checklist de validacao

- [ ] `docker compose down -v` executado quando a validacao precisa ser limpa.
- [ ] `docker compose up --build -d` executado sem erro.
- [ ] `docker compose ps` mostra quatro servicos `Up`.
- [ ] MySQL responde `mysqld is alive`.
- [ ] MySQL contem as tabelas principais.
- [ ] Seed do MySQL contem pelo menos `4` produtos.
- [ ] MongoDB responde `{ ok: 1 }`.
- [ ] Banco `vending_logs` acessivel.
- [ ] Backend responde `GET /health` com `status: ok`.
- [ ] Frontend responde HTTP `200` em `http://localhost:3000`.
- [ ] Logs dos containers podem ser consultados com `docker compose logs`.

## Comandos executados nesta validacao

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot_pass
docker compose exec mysql mysql -uvending_user -pvending_pass -e "SHOW TABLES; SELECT COUNT(*) AS products_count FROM products;" vending_machine
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')"
docker compose exec mongodb mongosh --quiet vending_logs --eval "db.getCollectionNames()"
```

```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-String -Pattern "Vending AI"
```
