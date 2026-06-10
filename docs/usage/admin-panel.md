# Painel Administrativo

Este documento descreve a estrutura e as funcionalidades do Painel Administrativo da Vending Machine Web Platform.

## 1. Acesso e Segurança

O acesso à área administrativa (`/admin/**`) é restrito exclusivamente a usuários com a role `ADMIN`.

- **Proteção de Rota**: Implementada via `RouteGuard` no frontend e `requireRole('ADMIN')` no backend.
- **Middleware**: Todas as requisições administrativas passam pelo `auth_middleware` para validação de JWT e pelo `requireRole` para autorização.
- **Tratamento de Erros**: Usuários sem permissão recebem erro `403 Forbidden` e são orientados a retornar para a área comum.

## 2. Dashboard (`/admin`)

O Dashboard oferece uma visão consolidada do sistema através de métricas em tempo real:

- **Vendas Totais**: Volume acumulado de pedidos.
- **Receita Total**: Soma bruta em BRL (convertida de centavos).
- **Máquinas Ativas**: Total de máquinas cadastradas e operacionais.
- **Estoque Baixo**: Alerta visual para itens abaixo do limite mínimo definido.
- **Falhas Recentes**: Contador de erros operacionais ou estornos nas últimas 24 horas.
- **Produtos**: Total de itens ativos no catálogo.

## 3. Navegação e Interface

- **Sidebar Administrativa**: Menu lateral fixo com acesso rápido a todos os módulos (Máquinas, Produtos, Inventário, Vendas, etc.).
- **Breadcrumbs**: Localização hierárquica para facilitar a navegação profunda.
- **Layout Responsivo**: O painel se ajusta de desktops a tablets, garantindo a gestão em diferentes dispositivos.

## 4. Módulos Disponíveis

- **Máquinas**: CRUD completo de máquinas e slots.
- **Produtos**: Gerenciamento de itens, preços e upload de imagens.
- **Inventário**: Controle de estoque por máquina e slot.
- **Vendas**: Consulta ao histórico global de transações.
- **JSON**: Importação e exportação de dados em lote.
- **Relatórios**: Geração de PDFs consolidados.
- **Gráficos**: Análise visual de desempenho mensal.
- **Logs XML**: Auditoria técnica via exportação de registros do MongoDB.

## 5. Auditoria (Logs)

Toda ação administrativa é registrada no **MongoDB** pelo `LogService`, capturando:
- Quem realizou a ação.
- O que foi alterado (antes/depois).
- IP e User Agent.
- Timestamp preciso.
