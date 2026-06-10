# Funcionamento do Backend

Este documento descreve detalhadamente o funcionamento interno do backend da Vending Machine Web Platform, incluindo a arquitetura, o fluxo de dados e as tecnologias utilizadas.

## Tecnologias e Frameworks

- **Runtime:** Node.js (v18+ recomendado).
- **Framework Web:** Express.js.
- **Bancos de Dados:**
  - **MySQL 8.0:** Armazena usuários, wallets, máquinas, produtos, estoque, vendas e comandos.
  - **MongoDB 7.0:** Armazena logs de acesso, auditoria de CRUDs, erros e eventos de sistema.
- **Autenticação:** `jsonwebtoken` (JWT) e `bcryptjs` para hashing de senhas.
- **Validação:** `joi` para validação de esquemas de dados.
- **Comunicação IoT:** `mqtt.js` para integração com o broker HiveMQ.
- **Upload de Arquivos:** `multer` para processamento de imagens de produtos e arquivos JSON.
- **Geração de XML:** `xmlbuilder2` para exportação de logs.

## Arquitetura: MVC + Service + DAO

O projeto segue rigorosamente a separação de responsabilidades exigida:

### 1. Camada de Rotas (`src/routes`)
Define os endpoints HTTP e associa middlewares e controllers. Nenhuma lógica de negócio reside aqui.

### 2. Middlewares (`src/middlewares`)
Interceptam a requisição para tarefas transversais:
- `auth_middleware`: Verifica o token JWT e carrega o usuário.
- `log_middleware`: Registra o acesso no MongoDB.
- `validation_middleware`: Valida o corpo/query/params da requisição.
- `error_middleware`: Centraliza o tratamento de exceções.

### 3. Camada de Controllers (`src/controllers`)
Recebe a requisição validada, extrai os dados necessários e chama os serviços correspondentes. É responsável apenas pela orquestração do fluxo HTTP e resposta ao cliente.

### 4. Camada de Services (`src/services`)
Contém **toda a lógica de negócio**. É aqui que ocorrem validações complexas (ex: saldo suficiente, estoque disponível), cálculos e chamadas a múltiplos DAOs dentro de transações.

### 5. Camada de DAOs (`src/dao`)
Responsável única e exclusivamente pela persistência dos dados. Contém as queries SQL para MySQL ou operações de agregação para MongoDB.

### 6. Interfaces (`src/interfaces`)
Define os contratos base (`IDAO`, `IService`, `IController`) para garantir consistência e facilitar a explicação acadêmica de POO.

## Fluxo de Compra e Transacionalidade

Um dos pontos críticos do backend é o checkout:

1. **Validação:** O `SaleService` valida usuário, máquina, produto, estoque e saldo.
2. **Transação MySQL:**
   - Inicia transação.
   - Bloqueia as linhas de wallet e estoque (SELECT FOR UPDATE).
   - Debita o saldo da wallet.
   - Cria transação de wallet.
   - Reserva o estoque (incrementa `quantity_reserved`).
   - Cria o registro de venda (`Sale`) e item de venda (`SaleItem`).
   - Cria o comando de dispensa (`DispenseCommand`).
   - Commita a transação.
3. **MQTT:** Após o sucesso no banco, o comando é publicado no tópico MQTT da máquina.

## Logs e Observabilidade

Cada operação relevante (Escrita no banco, Exportação, Login) gera um documento no MongoDB. Isso permite:
- Auditoria completa (quem fez o quê e quando).
- Recuperação de estado anterior (logs de UPDATE guardam o `before` e `after`).
- Monitoramento de erros com stack traces detalhados armazenados de forma persistente.

## Configuração e Inicialização

O arquivo `src/server.js` é o ponto de entrada, que:
1. Carrega variáveis de ambiente.
2. Inicializa as conexões com MySQL e MongoDB.
3. Configura o servidor Express.
4. Inicia o serviço MQTT.
5. Abre a porta para conexões.
