# Backup e restauração — etapa 1

A cópia anterior às alterações fica na raiz do workspace, em `backups/stage1-20261102/`, fora do código da aplicação. Essa pasta e `.local/` estão ignoradas pelo Git. O arquivo de código inclui configuração local e uploads: manter os backups privados.

## Artefatos desta execução

- `code-before.tar.gz`: código anterior à estabilização, sem node_modules e .next.
- `mysql.sql`: dump consistente das tabelas de negócio, com schema e dados.
- `mongodb.archive.gz`: coleção de logs com seus índices.
- `restore-verification.json`: SHA-256 dos arquivos, checksums das tabelas e contagem/índices restaurados.

## Procedimento de captura

O dump MySQL foi criado dentro do contêiner com `mysqldump --single-transaction --routines --triggers --set-gtid-purged=OFF --no-tablespaces`. O MongoDB foi exportado com `mongodump --db vending_logs --archive=... --gzip`. Os arquivos foram copiados com `docker compose cp`; o arquivo binário do MongoDB não passou por redirecionamento de texto do PowerShell.

Antes de repetir a captura, usar uma nova pasta de backup, verificar o destino absoluto e não sobrescrever esta cópia. Para snapshots que precisem representar exatamente o mesmo instante entre bancos, interromper escritas durante a captura; nesta execução o MySQL é transacional e os logs são uma captura independente.

## Restauração comprovada

Foram criados os contêineres do projeto Compose separado `vending-stage1-restore`, sem portas publicadas, com `network_mode: none` e armazenamento temporário. Não receberam volumes de dados da aplicação.

1. Inicializar MySQL vazio e importar o dump, sem executar seed da aplicação por cima dele.
2. Inicializar MongoDB vazio e executar `mongorestore --archive=... --gzip`.
3. Executar `CHECKSUM TABLE ... EXTENDED` para todas as tabelas na origem e na cópia, comparando as saídas.
4. Conferir contagem de logs e índices restaurados.

Resultado desta execução: **12 tabelas com checksums iguais; 455 documentos MongoDB e cinco índices recuperados; zero falhas de restauração**. Evidência detalhada em `restore-verification.json` no backup local. A extração do arquivo de código também é conferida separadamente.

## Recuperar sem destruir o runtime

Restaurar primeiro para uma pasta e bancos novos. Extrair `code-before.tar.gz` para essa pasta e fornecer as configurações locais. Apontar uma instância de teste aos bancos restaurados e validar autenticação, saldos, pedidos, estoque, imagens e logs. Só depois planejar uma eventual troca de instâncias.

Não importar um dump sobre bancos da aplicação em uso, não executar `docker compose down -v` e não eliminar os volumes atuais para verificar backups. As instâncias temporárias de verificação podem ser encerradas pelo nome do projeto separado; os arquivos de backup permanecem no workspace.
