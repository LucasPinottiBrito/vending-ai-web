# Auditoria e Logs (MongoDB)

Este documento descreve como os administradores podem monitorar as atividades do sistema e exportar logs para auditoria externa.

## 1. Monitoramento de Logs (`/admin/logs`)

A interface de logs fornece uma visão em tempo real de todos os eventos registrados no **MongoDB**.

- **Listagem Paginada**: Exibe os 100 registros mais recentes por padrão.
- **Filtros Avançados**:
    - **Usuário ou IP**: Filtre por e-mail, ID de usuário ou endereço IP de origem.
    - **Tipo de Evento**: Visualize apenas logins, criações, erros, exportações, etc.
    - **Período**: Restrinja a auditoria a um intervalo de datas específico.
- **Visualização de Detalhes**: Clique no ícone de olho para abrir um modal com o objeto JSON completo armazenado no MongoDB, incluindo dados "antes" e "depois" de alterações.

## 2. Exportação XML

Para processos formais de auditoria, o sistema permite a exportação dos logs em formato XML.

- **Botão Exportar XML**: Gera um arquivo baseado nos filtros selecionados na tela.
- **Estrutura do XML**: O arquivo contém metadados da exportação (quem gerou, filtros usados) e uma lista detalhada de cada log com todos os campos técnicos.
- **Download Direto**: O arquivo é servido com os cabeçalhos HTTP corretos para download imediato no navegador.

## 3. Arquitetura Técnica

- **Persistência**: Os logs são armazenados em uma coleção `logs` no MongoDB.
- **Performance**: As consultas utilizam índices por `timestamp` e `event_type` para garantir respostas rápidas mesmo com grandes volumes de dados.
- **Imutabilidade**: Por questões de segurança e integridade, registros de log não podem ser editados ou excluídos via API (erro `501 Not Implemented`).

## 4. Auditoria da Própria Auditoria

Toda vez que um administrador acessa a lista de logs ou realiza uma exportação XML, essa ação é registrada como um novo log do tipo `REQUEST_ACCESS` ou `EXPORT_XML`, criando uma trilha de auditoria completa.
