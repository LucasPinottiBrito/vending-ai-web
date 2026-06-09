# Fluxo de desenvolvimento

Este documento define a ordem de desenvolvimento da plataforma web da Vending Machine IoT. A sequencia preserva os requisitos academicos e evita iniciar telas ou integracoes antes da base obrigatoria estar pronta.

## 1. Infraestrutura

- Configurar Docker Compose com quatro servicos principais: `backend`, `frontend`, `mysql` e `mongodb`.
- Manter HiveMQ como broker MQTT externo.
- Definir portas padrao: frontend `3000`, backend `4000`, MySQL `3306` e MongoDB `27017`.
- Preparar volumes para MySQL, MongoDB e uploads.

## 2. Banco MySQL

- Criar `database/mysql/schema.sql` com tabelas, chaves primarias, chaves estrangeiras e regras de integridade.
- Criar `database/mysql/seed.sql` com dados iniciais.
- Garantir que dados de negocio fiquem no MySQL.
- Modelar o relacionamento N:N entre `sales` e `products` usando `sale_items`.
- Armazenar valores monetarios em centavos inteiros.

## 3. MongoDB logs

- Configurar MongoDB somente para logs.
- Criar a colecao `logs`.
- Definir o formato dos registros de acesso, CRUD, erros, imports, exports e relatorios.
- Preparar exportacao XML dos logs em etapa posterior.

## 4. Backend

- Criar backend Node.js + Express.
- Organizar o codigo em MVC + Service Layer + Router + Middleware.
- Implementar as interfaces obrigatorias `IDAO`, `IService` e `IController`.
- Implementar JWT proprio, bcrypt, middlewares de autenticacao, log, erro e validacao.
- Implementar DAOs para MySQL e MongoDB.
- Implementar regras de carteira, estoque, checkout, reserva, venda, reembolso e comandos de dispensa.
- Implementar importacao/exportacao JSON, relatorios e endpoints para Chart.js.

## 5. Frontend

- Criar frontend Next.js/React.
- Implementar fluxo mobile de usuario: catalogo por maquina, login, cadastro, carteira, checkout e historico.
- Implementar painel administrativo: maquinas, slots, produtos, inventario, usuarios, vendas, pagamentos, eventos, logs, import/export, relatorios e graficos.
- Usar dados reais do backend para catalogo, vendas, relatorios e Chart.js.
- Implementar feedback visual, validacoes, filtros, breadcrumbs e upload de imagens.

## 6. Integracao MQTT

- Implementar servico MQTT no backend sem acoplar regras de IoT aos controllers.
- Publicar comandos em `vending/{machine_id}/actions`.
- Consumir eventos em `vending/{machine_id}/events`.
- Consumir status em `vending/{machine_id}/status`.
- Tratar sucesso, falha, timeout, status da maquina e reembolso de forma idempotente.
- Manter firmware em `firmware/` como modulo complementar.

## 7. Testes finais

- Validar `docker-compose up --build`.
- Validar login, JWT, rotas protegidas e perfil admin.
- Validar CRUDs principais, upload de imagens, import/export JSON, exportacao XML, relatorio PDF e grafico Chart.js.
- Validar compra com saldo, compra sem saldo, falta de estoque, reserva de estoque e reembolso em falha.
- Revisar README, documentacao, DER, scripts SQL e material da entrega.
