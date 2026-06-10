# Relatórios PDF e Análise de Desempenho

Este documento descreve as ferramentas de auditoria e inteligência de negócio disponíveis para administradores.

## 1. Gestão Global de Vendas (`/admin/sales`)

A tela de vendas administrativas fornece uma visão panorâmica de todas as transações do sistema.

- **Filtros por Ator**: Visualize vendas por máquina específica ou por status.
- **Controle de Período**: Restrinja a listagem por datas para conciliação bancária ou fechamento.
- **Métricas Rápidas**: Cards com Receita Bruta, Total de Pedidos, Falhas e Estornos para o filtro selecionado.
- **Detalhamento**: Acesso direto à tela de acompanhamento de cada venda (mesma visão do cliente, mas com contexto administrativo).

## 2. Relatórios PDF (`/admin/reports`)

Geração de documentos formais para arquivamento ou prestação de contas.

- **Personalização**: Seleção de período, máquina e status.
- **Conteúdo do PDF**:
    - **Cabeçalho**: Título, data de geração e nome do administrador responsável.
    - **Sumário Executivo**: Resumo financeiro (total vendido) e operacional (taxa de sucesso).
    - **Tabela Detalhada**: Listagem dos registros filtrados com ID, Data, Produto, Status e Valor.
    - **Rodapé**: Numeração de páginas e identificação do sistema.
- **Tecnologia**: Gerado inteiramente no frontend via `jsPDF`, garantindo performance e privacidade dos dados.

## 3. Gráficos de Desempenho (`/admin/charts`)

Análise visual das tendências de venda ao longo do tempo.

- **Vendas Mensais**: Gráfico de barras comparativo por ano.
- **Indicadores Exibidos**:
    - **Quantidade**: Volume de vendas por mês.
    - **Receita**: Valor bruto acumulado.
    - **Falhas/Estornos**: Indicadores de saúde técnica da rede de máquinas.
- **Interatividade**: Tooltips detalhados ao passar o mouse sobre as barras.
- **Filtro Temporal**: Seleção de ano para análise histórica.

## 4. Auditoria e Segurança

- **Proteção ADMIN**: Todas as rotas e endpoints de dados para gráficos e relatórios exigem privilégio administrativo.
- **Logs de Geração**: O backend registra no MongoDB cada vez que um relatório é gerado ou dados de gráficos são consultados, capturando os filtros utilizados.
- **Integridade**: Os dados de receita são sempre lidos do MySQL (fonte da verdade), garantindo precisão nos centavos.
