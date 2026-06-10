# Documentação da API

Esta seção contém a documentação detalhada de todos os recursos, rotas e regras de negócio implementados no backend da Vending Machine Web Platform.

## Visão Geral

O backend foi desenvolvido utilizando Node.js e Express, seguindo uma arquitetura robusta de **MVC + Service Layer + Router + Middleware**.

- **Banco de Dados Principal:** MySQL (persistência de dados de negócio).
- **Banco de Dados de Logs:** MongoDB (auditoria e logs de sistema).
- **Autenticação:** Local via JWT (JSON Web Token).
- **Integração IoT:** MQTT para comunicação com hardware/simuladores.

## Seções da Documentação

### Core & Arquitetura
- [Arquitetura do Backend](backend-architecture.md): Detalhes sobre o fluxo de requisição, interfaces obrigatórias e camadas.
- [Middlewares](middlewares.md): Funcionamento dos middlewares de autenticação, log, erro e validação.

### Recursos (CRUDs e Business)
- [Autenticação & Usuários](auth.md): Registro, Login, Logout e Gerenciamento de Perfil.
- [Máquinas](machines.md): Gerenciamento de Vending Machines.
- [Slots](slots.md): Configuração de colunas e motores das máquinas.
- [Produtos](products.md): Catálogo de produtos, preços e imagens.
- [Inventário](inventory.md): Controle de estoque por slot e máquina.
- [Carteira & Pagamentos](wallet-payments.md): Saldo interno, recargas mockadas e transações.
- [Vendas & Checkout](sales.md): Fluxo de compra, reserva de estoque e status de venda.

### Funcionalidades Administrativas
- [Importação/Exportação JSON](import-export-json.md): Bulk import/export de produtos e inventário.
- [Logs & Exportação XML](logs-xml-export.md): Auditoria do sistema e exportação de logs do MongoDB.
- [Relatórios](reports.md): Geração de dados para relatórios de vendas e histórico.
- [Gráficos](charts.md): Endpoints de dados para Chart.js.

### Integração IoT
- [MQTT & Eventos](mqtt.md): Protocolo de comunicação, tópicos e eventos de hardware.

## Padrões de Resposta

Todas as respostas seguem o formato JSON padronizado:

**Sucesso (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

**Erro (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem amigável",
    "details": [ ... ]
  }
}
```
