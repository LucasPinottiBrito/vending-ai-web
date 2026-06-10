# Histórico de Compras e Detalhes

Este documento descreve como os usuários podem visualizar seu histórico de compras e os detalhes de cada transação.

## 1. Histórico de Pedidos (`/account/purchases`)

Nesta página, o usuário autenticado visualiza todos os seus pedidos realizados na plataforma.

### Funcionalidades:
- **Listagem**: Tabela com ID do pedido, nome do produto, nome da máquina, data/hora, status e valor total.
- **Filtros Avançados**:
    - **Status**: Filtrar por Autorizada, Dispensando, Entregue, Falha ou Estornada.
    - **Período**: Selecionar data inicial e final para restringir a busca.
- **Visualização Rápida**: Identificação visual imediata do status através de badges coloridos.

## 2. Detalhes do Pedido (`/account/purchases/[id]`)

Ao clicar em "Detalhes" em qualquer pedido da lista, o usuário é levado para a página de detalhes (que utiliza o mesmo componente de status em tempo real).

### Informações Disponíveis:
- **Resumo**: ID, status e valor total.
- **Timeline de Dispensa**: Progresso visual da entrega física do produto.
- **Instruções Dinâmicas**: Orientações baseadas no status (ex: "Retire seu produto" ou informações sobre estorno automático).
- **Suporte**: Botão "Relatar problema pelo WhatsApp" para contato direto com o administrador, já incluindo o ID do pedido.

## 3. Integração Técnica

- **Backend**: A listagem consome `GET /api/users/me/purchases`, que foi otimizado para retornar o nome do produto e da máquina diretamente na consulta principal.
- **Filtros**: Os filtros de status e data são processados no backend via parâmetros de query (`?status=...&start_date=...&end_date=...`).
- **Segurança**: O backend garante que um usuário comum só consiga listar e detalhar seus próprios pedidos. Tentativas de acessar pedidos de terceiros resultam em erro `403 Forbidden`.
